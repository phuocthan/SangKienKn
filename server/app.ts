import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import type { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID, randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "./db.js";
import { questionInput, type QuestionInput } from "../shared/questions.js";
import { isGroupUploadPath, registerGroupRoutes } from "./group-activities.js";
import {
  grantLearningMilestones,
  learningAnswersLocked,
  registerLearningRoutes,
} from "./learning.js";
import { findAvatar, avatarCollectionsFor } from "../shared/avatars.js";
import { registerAvatarUploads } from "./avatar-uploads.js";
import { studentLevel } from "../shared/student-levels.js";
import { enqueueWelcome } from "./welcome-email.js";
import {
  chapterLessons,
  addLesson,
  archiveLesson,
  lessonIsArchived,
  LessonError,
} from "./lesson-catalog.js";
import { loginEmail } from "../shared/login-email.js";

export type Row = Record<string, any>;
export type AppRequest = Request & { user?: Row; tokenHash?: string };
const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const treeLevel = (seconds: number) =>
  Math.min(5, Math.floor(seconds / 3600) + 1);

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function fail(status: number, message: string): never {
  throw new ApiError(status, message);
}
function text(value: unknown, label: string, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(400, `${label} không hợp lệ (tối đa ${max} ký tự).`);
  return (value as string).trim();
}
function password(value: unknown) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128)
    fail(400, "Mật khẩu phải có từ 8 đến 128 ký tự.");
  return value as string;
}

export function createApp(
  db: DatabaseSync,
  options: {
    now?: () => number;
    production?: boolean;
    demo?: boolean;
    quickLogin?: boolean;
    welcomeEmail?: boolean;
  } = {},
) {
  const now = options.now ?? Date.now;
  const publicUser = (u: Row) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    mustChange: !!u.must_change,
    uploadedAvatarId:
      db.prepare("SELECT id FROM avatar_uploads WHERE user_id=?").get(u.id)
        ?.id ?? null,
    avatarId:
      db
        .prepare("SELECT avatar_id FROM user_avatars WHERE user_id = ?")
        .get(u.id)?.avatar_id ?? null,
  });
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use("/api/chapters/:id/questions/import", express.json({ limit: "1mb" }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", (req, _res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (
        !req.is("application/json") &&
        !(
          req.method === "POST" &&
          (isGroupUploadPath(req.path) || req.path === "/auth/avatar/upload") &&
          req.is("multipart/form-data")
        )
      )
        return next(
          new ApiError(
            415,
            "Yêu cầu phải dùng JSON hoặc file tại chức năng hỗ trợ.",
          ),
        );
      if (req.headers["sec-fetch-site"] === "cross-site")
        return next(new ApiError(403, "Yêu cầu khác nguồn bị từ chối."));
      if (req.headers.origin) {
        let host: string;
        try {
          host = new URL(req.headers.origin).host;
        } catch {
          return next(new ApiError(403, "Nguồn yêu cầu không hợp lệ."));
        }
        if (host !== req.headers.host)
          return next(new ApiError(403, "Yêu cầu khác nguồn bị từ chối."));
      }
    }
    next();
  });
  function allowQuickLogin(req: Request) {
    const loopback = (value: string | undefined) =>
      ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(value ?? "");
    return (
      !!options.quickLogin &&
      !options.production &&
      loopback(req.ip) &&
      ["localhost", "127.0.0.1", "[::1]", "::1"].includes(req.hostname)
    );
  }
  function defaultAccount(role: "teacher" | "student") {
    return db
      .prepare("SELECT * FROM users WHERE role = ? ORDER BY rowid LIMIT 1")
      .get(role) as Row | undefined;
  }
  app.get("/api/health", (req, res) => {
    db.prepare("SELECT 1").get();
    const quickLogin = allowQuickLogin(req);
    const quickAccounts = quickLogin
      ? (["teacher", "student"] as const).flatMap((role) => {
          const user = defaultAccount(role);
          return user ? [{ role, name: user.name }] : [];
        })
      : [];
    res.json({ ok: true, demo: !!options.demo, quickLogin, quickAccounts });
  });

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !!options.production,
    path: "/",
    maxAge: 7 * 86400000,
  };
  function issueSession(user: Row, res: Response) {
    const token = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now());
    db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
      tokenHash(token),
      user.id,
      now() + 7 * 86400000,
    );
    res.cookie("greenedu_session", token, cookieOptions).json(publicUser(user));
  }
  app.post("/api/auth/quick-login", (req, res) => {
    if (!allowQuickLogin(req))
      fail(404, "Đăng nhập nhanh chưa được bật tại địa chỉ này.");
    const role = req.body?.role;
    if (role !== "teacher" && role !== "student")
      fail(400, "Chọn tài khoản giáo viên hoặc học sinh.");
    const user = defaultAccount(role);
    if (!user)
      fail(
        404,
        role === "teacher"
          ? "Chưa có tài khoản giáo viên trong database."
          : "Chưa có tài khoản học sinh trong database.",
      );
    issueSession(user, res);
  });
  const loginAttempts = new Map<string, { count: number; until: number }>();
  app.post("/api/auth/login", (req, res) => {
    const email = text(
      loginEmail(text(req.body?.email, "Email", 254)),
      "Email",
      254,
    ).toLowerCase();
    const pw = password(req.body?.password);
    const key = req.ip ?? "unknown";
    if (loginAttempts.size > 1000)
      for (const [k, v] of loginAttempts)
        if (v.until <= now()) loginAttempts.delete(k);
    let attempt = loginAttempts.get(key);
    if (!attempt || attempt.until <= now()) {
      attempt = { count: 0, until: now() + 15 * 60000 };
      loginAttempts.set(key, attempt);
    }
    if (attempt.count >= 20)
      fail(429, "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.");
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as Row | undefined;
    if (!user || !verifyPassword(pw, user.password)) {
      attempt.count++;
      fail(401, "Email hoặc mật khẩu chưa đúng.");
    }
    loginAttempts.delete(key);
    issueSession(user, res);
  });
  app.use("/api", (req: AppRequest, _res, next) => {
    const token = req.headers.cookie
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("greenedu_session="))
      ?.split("=")[1];
    if (token) {
      req.tokenHash = tokenHash(token);
      req.user = db
        .prepare(
          "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > ?",
        )
        .get(req.tokenHash, now()) as Row | undefined;
    }
    if (!req.user)
      return next(new ApiError(401, "Vui lòng đăng nhập để tiếp tục."));
    if (
      req.user.must_change &&
      !["/auth/me", "/auth/password", "/auth/logout"].includes(req.path)
    )
      return next(
        new ApiError(403, "Bạn cần đổi mật khẩu trước khi tiếp tục."),
      );
    next();
  });
  app.get("/api/auth/me", (req: AppRequest, res) =>
    res.json(publicUser(req.user!)),
  );
  app.post("/api/auth/avatar", (req: AppRequest, res) => {
    const avatarId = req.body?.avatarId;
    const avatar = findAvatar(avatarId);
    if (
      avatar &&
      !avatarCollectionsFor(req.user!.role).includes(avatar.collection)
    )
      fail(403, "Học sinh không được chọn avatar giáo viên.");
    if (
      avatarId !== null &&
      !avatar &&
      !(
        typeof avatarId === "string" &&
        db
          .prepare("SELECT 1 FROM avatar_uploads WHERE id=? AND user_id=?")
          .get(avatarId, req.user!.id)
      )
    )
      fail(400, "Vui lòng chọn avatar trong bộ sưu tập.");
    if (avatarId === null) {
      db.prepare("DELETE FROM user_avatars WHERE user_id = ?").run(
        req.user!.id,
      );
    } else {
      db.prepare(
        "INSERT INTO user_avatars (user_id,avatar_id) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET avatar_id = excluded.avatar_id",
      ).run(req.user!.id, avatarId);
    }
    res.json(publicUser(req.user!));
  });
  registerAvatarUploads(app, db, publicUser, fail);
  app.post("/api/auth/logout", (req: AppRequest, res) => {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(req.tokenHash!);
    db.prepare("DELETE FROM study_sessions WHERE student_id = ?").run(
      req.user!.id,
    );
    res
      .clearCookie("greenedu_session", { ...cookieOptions, maxAge: undefined })
      .json({ ok: true });
  });
  app.post("/api/auth/password", (req: AppRequest, res) => {
    const old = password(req.body?.currentPassword),
      next = password(req.body?.newPassword);
    if (!verifyPassword(old, req.user!.password))
      fail(400, "Mật khẩu hiện tại chưa đúng.");
    if (old === next) fail(400, "Hãy chọn mật khẩu khác mật khẩu hiện tại.");
    db.prepare(
      "UPDATE users SET password = ?, must_change = 0 WHERE id = ?",
    ).run(hashPassword(next), req.user!.id);
    db.prepare(
      "DELETE FROM sessions WHERE user_id = ? AND token_hash != ?",
    ).run(req.user!.id, req.tokenHash!);
    res.json(publicUser({ ...req.user!, must_change: 0 }));
  });

  function teacher(req: AppRequest) {
    if (req.user!.role !== "teacher")
      fail(403, "Chỉ giáo viên được thực hiện thao tác này.");
  }
  function student(req: AppRequest) {
    if (req.user!.role !== "student")
      fail(403, "Chỉ học sinh được thực hiện thao tác này.");
  }
  function admin(req: AppRequest) {
    if (req.user!.role !== "admin")
      fail(403, "Chỉ Admin được quản lý tài khoản toàn trường.");
  }
  app.get("/api/accounts", (req: AppRequest, res) => {
    admin(req);
    res.json(
      db
        .prepare(
          `SELECT u.id,u.name,u.email,u.role,u.must_change,
      (SELECT COUNT(*) FROM memberships m WHERE m.student_id = u.id) AS classCount
      FROM users u ORDER BY u.rowid DESC`,
        )
        .all()
        .map((u) => ({ ...publicUser(u), classCount: u.classCount })),
    );
  });
  app.get("/api/accounts/classrooms", (req: AppRequest, res) => {
    admin(req);
    res.json(
      db
        .prepare(
          `SELECT c.id,c.name,c.subject,u.name AS teacherName
      FROM classrooms c JOIN users u ON u.id = c.teacher_id ORDER BY c.name`,
        )
        .all(),
    );
  });
  app.post("/api/accounts", (req: AppRequest, res) => {
    admin(req);
    const role = req.body?.role;
    if (!["teacher", "student"].includes(role))
      fail(400, "Chọn vai trò giáo viên hoặc học sinh.");
    const email = text(req.body?.email, "Email", 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail(400, "Email không hợp lệ.");
    const name = text(req.body?.name, "Họ tên", 100),
      pw = password(req.body?.password);
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email))
      fail(409, "Email đã tồn tại. Hãy dùng email khác.");
    const classId = req.body?.classroomId;
    if (
      classId &&
      (role !== "student" ||
        typeof classId !== "string" ||
        !db.prepare("SELECT id FROM classrooms WHERE id = ?").get(classId))
    )
      fail(400, "Lớp học không hợp lệ; chỉ học sinh được thêm vào lớp.");
    const id = randomUUID();
    db.exec("BEGIN");
    try {
      db.prepare("INSERT INTO users VALUES (?,?,?,?,?,1)").run(
        id,
        email,
        name,
        hashPassword(pw),
        role,
      );
      if (classId)
        db.prepare("INSERT INTO memberships VALUES (?,?)").run(classId, id);
      if (options.welcomeEmail) enqueueWelcome(db, id, now());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.status(201).json({ id, name, email, role, mustChange: true });
  });
  app.post("/api/accounts/:id/password", (req: AppRequest, res) => {
    admin(req);
    const id = String(req.params.id);
    const target = db.prepare("SELECT role FROM users WHERE id = ?").get(id);
    if (!target) fail(404, "Không tìm thấy tài khoản.");
    if (target.role === "admin")
      fail(403, "Admin đổi mật khẩu cá nhân trong phần Tài khoản.");
    const pw = password(req.body?.password);
    db.prepare(
      "UPDATE users SET password = ?, must_change = 1 WHERE id = ?",
    ).run(hashPassword(pw), id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM study_sessions WHERE student_id = ?").run(id);
    res.json({ ok: true });
  });
  function classroom(req: AppRequest, id: string) {
    const row = db.prepare("SELECT * FROM classrooms WHERE id = ?").get(id) as
      Row | undefined;
    if (!row) fail(404, "Không tìm thấy lớp học.");
    if (
      req.user!.role === "teacher"
        ? row.teacher_id !== req.user!.id
        : !db
            .prepare(
              "SELECT 1 FROM memberships WHERE classroom_id = ? AND student_id = ?",
            )
            .get(id, req.user!.id)
    )
      fail(403, "Bạn không có quyền truy cập lớp học này.");
    return row;
  }
  function chapter(req: AppRequest, id: string) {
    const row = db.prepare("SELECT * FROM chapters WHERE id = ?").get(id) as
      Row | undefined;
    if (!row) fail(404, "Không tìm thấy chương.");
    classroom(req, row.classroom_id);
    return row;
  }
  function summary(chapterId: string, userId: string) {
    const seconds = Math.floor(
      Number(
        (
          db
            .prepare(
              "SELECT seconds FROM progress WHERE chapter_id = ? AND student_id = ?",
            )
            .get(chapterId, userId) as Row | undefined
        )?.seconds ?? 0,
      ),
    );
    const a = db
      .prepare(
        `SELECT COUNT(*) AS total, COALESCE(SUM(a.correct),0) AS correct FROM attempts a JOIN questions q ON q.id = a.question_id WHERE q.chapter_id = ? AND a.student_id = ?`,
      )
      .get(chapterId, userId) as Row;
    const c = db
      .prepare(
        "SELECT COUNT(*) AS count FROM corrections c JOIN questions q ON q.id = c.question_id WHERE q.chapter_id = ? AND c.student_id = ? AND c.resolved = 0",
      )
      .get(chapterId, userId) as Row;
    return {
      seconds,
      level: treeLevel(seconds),
      total: Number(a.total),
      correct: Number(a.correct),
      openCorrections: Number(c.count),
    };
  }
  app.get("/api/classrooms", (req: AppRequest, res) => {
    const rows = db
      .prepare(
        req.user!.role === "teacher"
          ? "SELECT c.*, u.name AS teacherName FROM classrooms c JOIN users u ON u.id = c.teacher_id WHERE c.teacher_id = ? ORDER BY c.rowid"
          : "SELECT c.*, u.name AS teacherName FROM classrooms c JOIN users u ON u.id = c.teacher_id JOIN memberships m ON m.classroom_id = c.id WHERE m.student_id = ? ORDER BY c.rowid",
      )
      .all(req.user!.id) as Row[];
    res.json(
      rows.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        grade: c.grade,
        teacherName: c.teacherName,
        studentLevel:
          req.user!.role === "student"
            ? studentLevel(
                Number(
                  db
                    .prepare(
                      "SELECT COALESCE(SUM(CAST(p.seconds AS INTEGER)),0) AS seconds FROM progress p JOIN chapters ch ON ch.id=p.chapter_id WHERE p.student_id=? AND ch.classroom_id=?",
                    )
                    .get(req.user!.id, c.id)!.seconds,
                ),
              )
            : null,
        studentCount: (
          db
            .prepare(
              "SELECT COUNT(*) AS count FROM memberships WHERE classroom_id = ?",
            )
            .get(c.id) as Row
        ).count,
        chapters: (
          db
            .prepare(
              "SELECT id,title FROM chapters WHERE classroom_id = ? ORDER BY rowid",
            )
            .all(c.id) as Row[]
        ).map((ch) => ({
          ...ch,
          lessons: chapterLessons(db, ch.id),
          canManageLessons: req.user!.role === "teacher",
          questionCount: (
            db
              .prepare(
                "SELECT COUNT(*) AS count FROM questions WHERE chapter_id = ? AND active = 1 AND is_current = 1",
              )
              .get(ch.id) as Row
          ).count,
          ...summary(ch.id, req.user!.id),
        })),
      })),
    );
  });
  app.post("/api/classrooms", (req: AppRequest, res) => {
    teacher(req);
    const name = text(req.body?.name, "Tên lớp", 80),
      subject = text(req.body?.subject, "Môn học", 80),
      grade = text(req.body?.grade, "Khối lớp", 20);
    const id = randomUUID();
    const key = (value: string) =>
      value
        .normalize("NFC")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("vi");
    // Keep existing classes intact; serialize the check/insert across DB writers.
    db.exec("BEGIN IMMEDIATE");
    try {
      const existing = db
        .prepare(
          "SELECT name,subject,grade FROM classrooms WHERE teacher_id = ?",
        )
        .all(req.user!.id);
      if (
        existing.some(
          (c) =>
            key(String(c.name)) === key(name) &&
            key(String(c.subject)) === key(subject) &&
            key(String(c.grade)) === key(grade),
        )
      )
        fail(
          409,
          "Lớp học đã tồn tại với cùng tên, môn học và khối. Hãy chọn lớp có sẵn.",
        );
      db.prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)").run(
        id,
        name,
        subject,
        grade,
        req.user!.id,
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.status(201).json({ id });
  });
  app.post("/api/chapters/:id/lessons", (req: AppRequest, res) => {
    teacher(req);
    const ch = chapter(req, String(req.params.id));
    try {
      res
        .status(201)
        .json(
          addLesson(db, String(ch.id), text(req.body?.title, "Tên bài", 120)),
        );
    } catch (error) {
      if (error instanceof LessonError) fail(error.status, error.message);
      throw error;
    }
  });
  app.post("/api/chapters/:id/lessons/delete", (req: AppRequest, res) => {
    teacher(req);
    const ch = chapter(req, String(req.params.id));
    try {
      res.json(
        archiveLesson(
          db,
          String(ch.id),
          text(req.body?.title, "Tên bài", 120),
          req.user!.id,
          now(),
        ),
      );
    } catch (error) {
      if (error instanceof LessonError) fail(error.status, error.message);
      throw error;
    }
  });
  app.post("/api/classrooms/:id/chapters", (req: AppRequest, res) => {
    teacher(req);
    classroom(req, String(req.params.id));
    const title = text(req.body?.title, "Tên chương", 120),
      id = randomUUID();
    db.prepare("INSERT INTO chapters VALUES (?,?,?)").run(
      id,
      String(req.params.id),
      title,
    );
    res.status(201).json({ id });
  });

  app.get("/api/classrooms/:id/garden", (req: AppRequest, res) => {
    const classId = String(req.params.id);
    classroom(req, classId);
    const trees = db
      .prepare(
        `
      SELECT u.id AS studentId, u.name AS studentName,
             ch.id AS chapterId, ch.title AS chapterTitle
      FROM progress p
      JOIN users u ON u.id = p.student_id
      JOIN chapters ch ON ch.id = p.chapter_id
      JOIN memberships m ON m.student_id = p.student_id AND m.classroom_id = ch.classroom_id
      WHERE ch.classroom_id = ? AND p.seconds >= 14400
      ORDER BY u.name, ch.rowid, u.id
    `,
      )
      .all(classId);
    res.json({ trees });
  });

  app.get("/api/classrooms/:id/leaderboard", (req: AppRequest, res) => {
    const classId = String(req.params.id);
    classroom(req, classId);
    const rows = db
      .prepare(
        `
      SELECT u.id, u.name,
        COALESCE((SELECT SUM(CAST(p.seconds AS INTEGER)) FROM progress p
          JOIN chapters ch ON ch.id = p.chapter_id
          WHERE p.student_id = u.id AND ch.classroom_id = ?), 0) AS seconds,
        (SELECT COUNT(*) FROM progress p JOIN chapters ch ON ch.id = p.chapter_id
          WHERE p.student_id = u.id AND ch.classroom_id = ? AND p.seconds >= 14400) AS bloomedTrees,
        (SELECT COUNT(*) FROM corrections cr JOIN questions q ON q.id = cr.question_id
          JOIN chapters ch ON ch.id = q.chapter_id
          WHERE cr.student_id = u.id AND ch.classroom_id = ? AND cr.resolved = 1) AS resolvedCorrections
      FROM users u JOIN memberships m ON m.student_id = u.id
      WHERE m.classroom_id = ?
    `,
      )
      .all(classId, classId, classId, classId) as Row[];
    const members = rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      seconds: Number(r.seconds),
      studentLevel: studentLevel(Number(r.seconds)),
      bloomedTrees: Number(r.bloomedTrees),
      resolvedCorrections: Number(r.resolvedCorrections),
    }));
    function rank(
      compare: (
        a: (typeof members)[number],
        b: (typeof members)[number],
      ) => number,
      eligible: (r: (typeof members)[number]) => boolean,
    ) {
      let previous: (typeof members)[number] | undefined;
      let position = 0;
      return members
        .filter(eligible)
        .sort(
          (a, b) =>
            compare(a, b) ||
            a.name.localeCompare(b.name, "vi") ||
            a.id.localeCompare(b.id),
        )
        .map((member, index) => {
          if (!previous || compare(previous, member) !== 0)
            position = index + 1;
          previous = member;
          return { ...member, rank: position };
        });
    }
    res.json({
      participantCount: members.length,
      activeStudents: members.filter(
        (m) => m.seconds > 0 || m.resolvedCorrections > 0,
      ).length,
      totalSeconds: members.reduce((n, m) => n + m.seconds, 0),
      bloomedTrees: members.reduce((n, m) => n + m.bloomedTrees, 0),
      effort: rank(
        (a, b) => b.seconds - a.seconds || b.bloomedTrees - a.bloomedTrees,
        (m) => m.seconds > 0,
      ),
      repairs: rank(
        (a, b) => b.resolvedCorrections - a.resolvedCorrections,
        (m) => m.resolvedCorrections > 0,
      ),
    });
  });

  function roster(classId: string) {
    return (
      db
        .prepare(
          "SELECT u.id,u.name,u.email,a.avatar_id AS avatarId FROM users u JOIN memberships m ON m.student_id = u.id LEFT JOIN user_avatars a ON a.user_id = u.id WHERE m.classroom_id = ? ORDER BY u.name",
        )
        .all(classId) as Row[]
    ).map((u) => {
      const chapters = db
        .prepare("SELECT id FROM chapters WHERE classroom_id = ?")
        .all(classId) as Row[];
      const summaries = chapters.map((c) => summary(c.id, u.id));
      return {
        id: String(u.id),
        name: String(u.name),
        email: String(u.email),
        avatarId: u.avatarId ?? null,
        seconds: summaries.reduce((n, s) => n + s.seconds, 0),
        studentLevel: studentLevel(
          summaries.reduce((n, s) => n + s.seconds, 0),
        ),
        total: summaries.reduce((n, s) => n + s.total, 0),
        correct: summaries.reduce((n, s) => n + s.correct, 0),
        openCorrections: summaries.reduce((n, s) => n + s.openCorrections, 0),
        trees: summaries.filter((s) => s.level === 5).length,
      };
    });
  }
  app.get("/api/classrooms/:id/students", (req: AppRequest, res) => {
    teacher(req);
    classroom(req, String(req.params.id));
    res.json(roster(String(req.params.id)));
  });
  app.post("/api/classrooms/:id/students", (req: AppRequest, res) => {
    teacher(req);
    const c = classroom(req, String(req.params.id));
    const email = text(req.body?.email, "Email", 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail(400, "Email không hợp lệ.");
    const name = text(req.body?.name, "Họ tên", 100),
      pw = password(req.body?.password);
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email))
      fail(
        409,
        "Email đã tồn tại. Chọn ‘Tài khoản có sẵn’ để thêm học sinh vào lớp.",
      );
    const id = randomUUID();
    db.exec("BEGIN");
    try {
      db.prepare("INSERT INTO users VALUES (?,?,?,?,?,1)").run(
        id,
        email,
        name,
        hashPassword(pw),
        "student",
      );
      db.prepare("INSERT INTO memberships VALUES (?,?)").run(c.id, id);
      if (options.welcomeEmail) enqueueWelcome(db, id, now());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.status(201).json({ id });
  });
  app.post("/api/classrooms/:id/memberships", (req: AppRequest, res) => {
    teacher(req);
    const c = classroom(req, String(req.params.id));
    const email = text(req.body?.email, "Email", 254).toLowerCase();
    const target = db
      .prepare("SELECT id,role FROM users WHERE email = ?")
      .get(email);
    if (!target || target.role !== "student")
      fail(404, "Không tìm thấy tài khoản học sinh với email này.");
    if (
      db
        .prepare(
          "SELECT 1 FROM memberships WHERE classroom_id = ? AND student_id = ?",
        )
        .get(c.id, target.id)
    )
      fail(409, "Học sinh đã có trong lớp.");
    db.prepare("INSERT INTO memberships VALUES (?,?)").run(c.id, target.id);
    res.status(201).json({ id: target.id });
  });
  app.post(
    "/api/classrooms/:id/students/:studentId/password",
    (req: AppRequest, res) => {
      teacher(req);
      classroom(req, String(req.params.id));
      const id = String(req.params.studentId);
      if (
        !db
          .prepare(
            "SELECT 1 FROM memberships WHERE classroom_id = ? AND student_id = ?",
          )
          .get(String(req.params.id), id)
      )
        fail(404, "Học sinh không thuộc lớp này.");
      // Prevent a teacher from resetting shared accounts managed by another teacher.
      if (
        db
          .prepare(
            "SELECT 1 FROM memberships m JOIN classrooms c ON c.id = m.classroom_id WHERE m.student_id = ? AND c.teacher_id != ?",
          )
          .get(id, req.user!.id)
      )
        fail(
          403,
          "Tài khoản có lớp do giáo viên khác quản lý. Cần quản trị viên hỗ trợ.",
        );
      const pw = password(req.body?.password);
      db.prepare(
        "UPDATE users SET password = ?, must_change = 1 WHERE id = ?",
      ).run(hashPassword(pw), id);
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
      db.prepare("DELETE FROM study_sessions WHERE student_id = ?").run(id);
      res.json({ ok: true });
    },
  );
  app.get("/api/classrooms/:id/export", (req: AppRequest, res) => {
    teacher(req);
    const c = classroom(req, String(req.params.id));
    const cell = (v: unknown) => {
      const s = String(v);
      return `"${(/^[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""')}"`;
    };
    const rows = [
      [
        "Họ tên",
        "Email",
        "Phút học có hoạt động",
        "Lượt luyện tập",
        "Tỷ lệ đúng (%)",
        "Câu cần sửa",
        "Cây cấp 5",
      ],
      ...roster(c.id).map((u) => [
        u.name,
        u.email,
        Math.floor(u.seconds / 60),
        u.total,
        u.total ? Math.round((u.correct / u.total) * 100) : "",
        u.openCorrections,
        u.trees,
      ]),
    ];
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="greenedu-tien-do.csv"',
    );
    res
      .type("text/csv")
      .send("\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n"));
  });
  function questionPayload(value: unknown) {
    try {
      return questionInput(value);
    } catch (e) {
      return fail(
        400,
        e instanceof Error ? e.message : "Câu hỏi không hợp lệ.",
      );
    }
  }
  function questionContent(q: Row): QuestionInput {
    return {
      text: q.text,
      lesson: q.lesson,
      choices: JSON.parse(q.choices),
      correctIndex: q.correct_index,
      explanation: q.explanation,
    };
  }
  function insertQuestion(
    chapterId: string,
    content: QuestionInput,
    metadata?: { familyId: string; version: number; active: boolean },
  ) {
    if (lessonIsArchived(db, chapterId, content.lesson))
      fail(409, "Bài đã bị xóa. Thêm lại bài trước khi thêm hoặc sửa câu hỏi.");
    const id = randomUUID();
    db.prepare(
      `INSERT INTO questions
      (id,chapter_id,text,choices,correct_index,explanation,lesson,active,is_current,version,family_id,changed_at)
      VALUES (?,?,?,?,?,?,?,?,1,?,?,?)`,
    ).run(
      id,
      chapterId,
      content.text,
      JSON.stringify(content.choices),
      content.correctIndex,
      content.explanation,
      content.lesson,
      metadata ? Number(metadata.active) : 1,
      metadata?.version ?? 1,
      metadata?.familyId ?? null,
      now(),
    );
    return id;
  }
  function ownedQuestion(req: AppRequest) {
    teacher(req);
    const q = db
      .prepare("SELECT * FROM questions WHERE id = ?")
      .get(String(req.params.id)) as Row | undefined;
    if (!q) fail(404, "Không tìm thấy câu hỏi.");
    chapter(req, q.chapter_id);
    return q;
  }
  function questionView(q: Row, req: AppRequest) {
    return {
      id: q.id,
      chapterId: q.chapter_id,
      lesson: q.lesson,
      text: q.text,
      choices: JSON.parse(q.choices),
      active: !!q.active,
      isCurrent: !!q.is_current,
      version: Number(q.version),
      changedAt: q.changed_at,
      correction: !!db
        .prepare(
          "SELECT 1 FROM corrections WHERE question_id = ? AND student_id = ? AND resolved = 0",
        )
        .get(q.id, req.user!.id),
      ...(req.user!.role === "teacher"
        ? { correctIndex: q.correct_index, explanation: q.explanation }
        : {}),
    };
  }
  app.get("/api/chapters/:id/questions", (req: AppRequest, res) => {
    chapter(req, String(req.params.id));
    const lesson =
      req.query.lesson === undefined
        ? undefined
        : text(req.query.lesson, "Bài học", 120);
    if (req.query.mode !== undefined && req.query.mode !== "correction")
      fail(400, "Chế độ câu hỏi không hợp lệ.");
    if (req.query.showHidden !== undefined && req.query.showHidden !== "1")
      fail(400, "Bộ lọc câu hỏi không hợp lệ.");
    if (req.query.showHidden === "1") teacher(req);
    const params: (string | number)[] = [String(req.params.id)];
    let scope = "q.is_current = 1";
    if (req.query.mode === "correction") {
      student(req);
      scope =
        "EXISTS (SELECT 1 FROM corrections cr WHERE cr.question_id = q.id AND cr.student_id = ? AND cr.resolved = 0)";
      params.push(req.user!.id);
    } else if (req.query.showHidden !== "1") scope += " AND q.active = 1";
    if (lesson) {
      scope += " AND q.lesson = ?";
      params.push(lesson);
    }
    const rows = db
      .prepare(
        `SELECT q.* FROM questions q WHERE q.chapter_id = ? AND ${scope} ORDER BY q.rowid`,
      )
      .all(...params) as Row[];
    res.json(rows.map((q) => questionView(q, req)));
  });
  app.post("/api/chapters/:id/questions", (req: AppRequest, res) => {
    teacher(req);
    chapter(req, String(req.params.id));
    const id = insertQuestion(String(req.params.id), questionPayload(req.body));
    res.status(201).json({ id });
  });
  app.post("/api/questions/:id/edit", (req: AppRequest, res) => {
    const q = ownedQuestion(req);
    if (!q.is_current)
      fail(409, "Câu hỏi đã có phiên bản mới. Hãy tải lại ngân hàng câu hỏi.");
    const content = questionPayload(req.body);
    if (JSON.stringify(content) === JSON.stringify(questionContent(q)))
      return res.json({ id: q.id, version: q.version });
    let id: string;
    db.exec("BEGIN");
    try {
      id = insertQuestion(q.chapter_id, content, {
        familyId: q.family_id ?? q.id,
        version: q.version + 1,
        active: !!q.active,
      });
      db.prepare(
        "UPDATE questions SET active = 0, is_current = 0 WHERE id = ?",
      ).run(q.id);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.json({ id, version: q.version + 1 });
  });
  app.post("/api/questions/:id/visibility", (req: AppRequest, res) => {
    const q = ownedQuestion(req);
    if (!q.is_current)
      fail(409, "Chỉ thay đổi trạng thái của phiên bản hiện tại.");
    if (typeof req.body?.active !== "boolean")
      fail(400, "Trạng thái câu hỏi không hợp lệ.");
    if (
      req.body.active &&
      lessonIsArchived(db, String(q.chapter_id), String(q.lesson))
    )
      fail(409, "Bài đã bị xóa. Thêm lại bài trước khi hiện câu hỏi.");
    db.prepare("UPDATE questions SET active = ? WHERE id = ?").run(
      Number(req.body.active),
      q.id,
    );
    res.json({ ok: true, active: req.body.active });
  });
  app.get("/api/questions/:id/history", (req: AppRequest, res) => {
    const q = ownedQuestion(req);
    const rows = db
      .prepare(
        "SELECT * FROM questions WHERE COALESCE(family_id,id) = ? ORDER BY version DESC",
      )
      .all(q.family_id ?? q.id) as Row[];
    res.json(rows.map((row) => questionView(row, req)));
  });
  app.post("/api/chapters/:id/questions/import", (req: AppRequest, res) => {
    teacher(req);
    const chapterId = String(req.params.id);
    chapter(req, chapterId);
    const requestId = text(req.body?.requestId, "Mã nhập câu hỏi", 100);
    if (
      !Array.isArray(req.body?.questions) ||
      req.body.questions.length < 1 ||
      req.body.questions.length > 100
    )
      fail(400, "Mỗi lần nhập cần từ 1 đến 100 câu hỏi.");
    const content = req.body.questions.map((row: unknown, index: number) => {
      try {
        return questionInput(row);
      } catch (e) {
        return fail(
          400,
          `Câu ${index + 1}: ${e instanceof Error ? e.message : "Dữ liệu không hợp lệ."}`,
        );
      }
    }) as QuestionInput[];
    const fingerprints = content.map((row) => JSON.stringify(row));
    if (new Set(fingerprints).size !== content.length)
      fail(400, "File có câu hỏi trùng nhau.");
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(content))
      .digest("hex");
    const existing = db
      .prepare("SELECT * FROM question_imports WHERE id = ?")
      .get(requestId) as Row | undefined;
    if (existing) {
      if (
        existing.chapter_id !== chapterId ||
        existing.teacher_id !== req.user!.id ||
        existing.fingerprint !== fingerprint
      )
        fail(409, "Mã nhập đã được dùng cho bộ câu hỏi khác.");
      return res.json({ ids: JSON.parse(existing.question_ids) });
    }
    const stored = db
      .prepare(
        "SELECT * FROM questions WHERE chapter_id = ? AND is_current = 1",
      )
      .all(chapterId) as Row[];
    const currentKeys = new Set(
      stored.map((q) => JSON.stringify(questionContent(q))),
    );
    const duplicate = fingerprints.findIndex((key) => currentKeys.has(key));
    if (duplicate !== -1)
      fail(
        409,
        `Câu ${duplicate + 1} đã có trong ngân hàng. Bỏ dòng trùng trước khi nhập lại.`,
      );
    let ids: string[];
    db.exec("BEGIN");
    try {
      ids = content.map((row) => insertQuestion(chapterId, row));
      db.prepare("INSERT INTO question_imports VALUES (?,?,?,?,?)").run(
        requestId,
        chapterId,
        req.user!.id,
        fingerprint,
        JSON.stringify(ids),
      );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.status(201).json({ ids });
  });
  app.post("/api/attempts", (req: AppRequest, res) => {
    student(req);
    if (learningAnswersLocked(db, req.user!.id, now()))
      fail(409, "Chờ khung thi đóng để luyện tập hoặc sửa sai.");
    const questionId = text(req.body?.questionId, "Câu hỏi"),
      id = text(req.body?.requestId, "Mã lượt làm", 100);
    const q = db
      .prepare("SELECT * FROM questions WHERE id = ?")
      .get(questionId) as Row | undefined;
    if (!q) fail(404, "Không tìm thấy câu hỏi.");
    chapter(req, q.chapter_id);
    const selected = req.body?.selected,
      mode = req.body?.mode;
    if (
      !Number.isInteger(selected) ||
      selected < 0 ||
      selected >= JSON.parse(q.choices).length ||
      !["practice", "correction"].includes(mode)
    )
      fail(400, "Câu trả lời không hợp lệ.");
    const existing = db
      .prepare("SELECT * FROM attempts WHERE id = ?")
      .get(id) as Row | undefined;
    if (
      existing &&
      (existing.student_id !== req.user!.id ||
        existing.question_id !== questionId ||
        existing.selected !== selected ||
        existing.mode !== mode)
    )
      fail(409, "Mã lượt làm đã được sử dụng.");
    if (!existing) {
      if (mode === "practice" && (!q.active || !q.is_current))
        fail(
          409,
          "Giáo viên đã ẩn hoặc cập nhật câu hỏi. Hãy kết thúc phiên và mở lại bài luyện tập.",
        );
      if (
        mode === "correction" &&
        !db
          .prepare(
            "SELECT 1 FROM corrections WHERE question_id = ? AND student_id = ? AND resolved = 0",
          )
          .get(questionId, req.user!.id)
      )
        fail(409, "Câu hỏi này không còn nằm trong danh sách cần sửa.");
      const correct = selected === q.correct_index;
      db.exec("BEGIN");
      try {
        db.prepare("INSERT INTO attempts VALUES (?,?,?,?,?,?,?)").run(
          id,
          req.user!.id,
          questionId,
          selected,
          Number(correct),
          mode,
          now(),
        );
        if (!correct)
          db.prepare(
            "INSERT INTO corrections VALUES (?,?,0,?) ON CONFLICT(student_id,question_id) DO UPDATE SET resolved = 0, updated_at = excluded.updated_at",
          ).run(req.user!.id, questionId, now());
        else if (mode === "correction")
          db.prepare(
            "UPDATE corrections SET resolved = 1, updated_at = ? WHERE student_id = ? AND question_id = ?",
          ).run(now(), req.user!.id, questionId);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
    res.json({
      correct: selected === q.correct_index,
      ...(mode === "correction" && selected !== q.correct_index
        ? { explanation: "Hãy xem lại kiến thức và tự làm lại câu này." }
        : { correctIndex: q.correct_index, explanation: q.explanation }),
      resolved: mode === "correction" && selected === q.correct_index,
    });
  });
  app.get("/api/corrections", (req: AppRequest, res) => {
    student(req);
    res.json(
      db
        .prepare(
          `SELECT q.id,q.chapter_id AS chapterId,q.text,q.choices,ch.title AS chapterTitle,c.name AS className,cr.updated_at AS updatedAt
      FROM corrections cr JOIN questions q ON q.id = cr.question_id JOIN chapters ch ON ch.id = q.chapter_id
      JOIN classrooms c ON c.id = ch.classroom_id JOIN memberships m ON m.classroom_id = c.id AND m.student_id = cr.student_id
      WHERE cr.student_id = ? AND cr.resolved = 0 ORDER BY cr.updated_at DESC`,
        )
        .all(req.user!.id)
        .map((raw) => {
          const r = raw as Row;
          return { ...r, choices: JSON.parse(r.choices), correction: true };
        }),
    );
  });
  app.post("/api/study/start", (req: AppRequest, res) => {
    student(req);
    if (learningAnswersLocked(db, req.user!.id, now()))
      fail(409, "Thời gian thi không tính vào thời gian chăm cây.");
    const id = text(req.body?.chapterId, "Chương");
    chapter(req, id);
    const sessionId = randomUUID();
    db.prepare(
      "INSERT INTO study_sessions VALUES (?,?,?,?,?,1) ON CONFLICT(student_id) DO UPDATE SET id = excluded.id, chapter_id = excluded.chapter_id, last_received = excluded.last_received, last_activity = excluded.last_activity, active = 1",
    ).run(sessionId, req.user!.id, id, now(), now());
    res.json({ sessionId });
  });
  app.post("/api/study/heartbeat", (req: AppRequest, res) => {
    student(req);
    if (
      typeof req.body?.active !== "boolean" ||
      typeof req.body?.interacted !== "boolean"
    )
      fail(400, "Trạng thái học không hợp lệ.");
    const s = db
      .prepare("SELECT * FROM study_sessions WHERE id = ? AND student_id = ?")
      .get(text(req.body?.sessionId, "Phiên học"), req.user!.id) as
      Row | undefined;
    if (!s) fail(409, "Phiên học đã kết thúc hoặc đang mở ở cửa sổ khác.");
    chapter(req, s.chapter_id);
    const timestamp = now();
    const delta = Math.max(0, timestamp - s.last_received);
    // Server time only. Do not credit disconnection gaps, hidden tabs, or stale activity.
    const end = Math.min(timestamp, s.last_activity + 130000);
    const seconds =
      req.body.active && s.active && delta <= 30000
        ? Math.max(0, end - s.last_received) / 1000
        : 0;
    db.prepare(
      "INSERT INTO progress VALUES (?,?,?) ON CONFLICT(student_id,chapter_id) DO UPDATE SET seconds = seconds + excluded.seconds",
    ).run(req.user!.id, s.chapter_id, seconds);
    db.prepare(
      "UPDATE study_sessions SET last_received = ?, last_activity = ?, active = ? WHERE id = ?",
    ).run(
      timestamp,
      req.body.interacted && req.body.active ? timestamp : s.last_activity,
      Number(req.body.active),
      s.id,
    );
    grantLearningMilestones(db, req.user!.id, now());
    res.json({
      ...summary(s.chapter_id, req.user!.id),
      creditedSeconds: seconds,
    });
  });
  app.post("/api/study/stop", (req: AppRequest, res) => {
    student(req);
    const id = text(req.body?.sessionId, "Phiên học");
    const s = db
      .prepare("SELECT * FROM study_sessions WHERE id = ? AND student_id = ?")
      .get(id, req.user!.id) as Row | undefined;
    if (s) {
      const timestamp = now(),
        delta = Math.max(0, timestamp - s.last_received);
      const seconds =
        s.active && delta <= 30000
          ? Math.max(
              0,
              Math.min(timestamp, s.last_activity + 130000) - s.last_received,
            ) / 1000
          : 0;
      db.prepare(
        "INSERT INTO progress VALUES (?,?,?) ON CONFLICT(student_id,chapter_id) DO UPDATE SET seconds = seconds + excluded.seconds",
      ).run(req.user!.id, s.chapter_id, seconds);
      db.prepare(
        "DELETE FROM study_sessions WHERE id = ? AND student_id = ?",
      ).run(id, req.user!.id);
    }
    grantLearningMilestones(db, req.user!.id, now());
    res.json({ ok: true });
  });
  registerLearningRoutes(app, db, {
    now,
    text,
    fail,
    teacher,
    student,
    classroom,
  });
  registerGroupRoutes(app, db, {
    now,
    text,
    fail,
    teacher,
    student,
    classroom,
  });
  app.use("/api", (_req, _res, next) =>
    next(new ApiError(404, "Không tìm thấy chức năng.")),
  );
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof ApiError)
        return res.status(error.status).json({ error: error.message });
      if (error instanceof SyntaxError && "body" in error)
        return res.status(400).json({ error: "Dữ liệu JSON không hợp lệ." });
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 413
      )
        return res
          .status(413)
          .json({ error: "Dữ liệu vượt quá giới hạn cho phép." });
      console.error(error);
      res.status(500).json({ error: "Có lỗi hệ thống. Vui lòng thử lại." });
    },
  );
  return app;
}
