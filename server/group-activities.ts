import type { Express, RequestHandler } from "express";
import type { DatabaseSync } from "node:sqlite";
import { createHash, randomInt, randomUUID } from "node:crypto";
import multer from "multer";
import type { AppRequest, Row } from "./app.js";
import { requirementWordText, validateActivityFile } from "./activity-files.js";
import type {
  ActivityFile,
  ActivityGroup,
  GroupActivity,
  GroupSubmission,
} from "../shared/group-activities.js";

export const isGroupUploadPath = (path: string) =>
  /^\/(?:api\/)?(?:classrooms\/[^/]+\/group-activities|group-activities\/[^/]+\/submissions)\/?$/.test(
    path,
  );

type Context = {
  now: () => number;
  text: (value: unknown, label: string, max?: number) => string;
  fail: (status: number, message: string) => never;
  teacher: (req: AppRequest) => void;
  student: (req: AppRequest) => void;
  classroom: (req: AppRequest, id: string) => Row;
};

export function registerGroupRoutes(
  app: Express,
  db: DatabaseSync,
  context: Context,
) {
  const { now, text, teacher, student, classroom } = context;
  const fail: Context["fail"] = context.fail;
  const hash = (value: string | Buffer) =>
    createHash("sha256").update(value).digest("hex");
  function optionalText(value: unknown, label: string, max: number) {
    return value === undefined || value === "" ? "" : text(value, label, max);
  }
  function activity(req: AppRequest, id = String(req.params.id)) {
    const row = db
      .prepare("SELECT * FROM group_activities WHERE id = ?")
      .get(id) as Row | undefined;
    if (!row) fail(404, "Không tìm thấy hoạt động nhóm.");
    classroom(req, row.classroom_id);
    return row;
  }
  function myGroup(req: AppRequest, activityId: string) {
    return db
      .prepare(
        "SELECT g.* FROM activity_groups g JOIN activity_group_members m ON m.group_id = g.id WHERE g.activity_id = ? AND m.student_id = ?",
      )
      .get(activityId, req.user!.id) as Row | undefined;
  }
  function deadline(value: unknown) {
    const timestamp = Number(value);
    if (
      !Number.isSafeInteger(timestamp) ||
      timestamp <= 0 ||
      timestamp > 8640000000000000
    )
      fail(400, "Hạn nộp không hợp lệ.");
    return timestamp;
  }
  function upload(field: string, maxMB: number): RequestHandler {
    const receive = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: maxMB * 1024 * 1024,
        files: 1,
        fields: 8,
        fieldSize: 100 * 1024,
        parts: 10,
      },
    }).single(field);
    return (req, res, next) => {
      if (!req.is("multipart/form-data")) return next();
      receive(req, res, (error: unknown) => {
        if (error) {
          const tooLarge =
            error instanceof multer.MulterError &&
            error.code === "LIMIT_FILE_SIZE";
          return res.status(tooLarge ? 413 : 400).json({
            error: tooLarge
              ? `File vượt quá ${maxMB} MB.`
              : "Upload không hợp lệ. Chỉ chọn một file đúng trường yêu cầu.",
          });
        }
        next();
      });
    };
  }
  function fileMeta(id: string | null): ActivityFile | null {
    if (!id) return null;
    return (
      (db
        .prepare(
          "SELECT id,filename,size,mime FROM activity_files WHERE id = ?",
        )
        .get(id) as ActivityFile | undefined) ?? null
    );
  }
  function insertFile(
    file: Express.Multer.File,
    activityId: string,
    groupId: string | null,
    kind: "requirement" | "submission",
    userId: string,
    timestamp: number,
  ) {
    const metadata = validateActivityFile(file, kind === "requirement");
    const id = randomUUID();
    db.prepare("INSERT INTO activity_files VALUES (?,?,?,?,?,?,?,?,?,?)").run(
      id,
      activityId,
      groupId,
      kind,
      metadata.filename,
      metadata.mime,
      metadata.size,
      file.buffer,
      userId,
      timestamp,
    );
    return id;
  }
  function detail(req: AppRequest, row: Row): GroupActivity {
    const room = classroom(req, row.classroom_id);
    const teacherName = (
      db
        .prepare("SELECT name FROM users WHERE id = ?")
        .get(room.teacher_id) as Row
    ).name;
    const groupRows =
      req.user!.role === "teacher"
        ? (db
            .prepare(
              "SELECT * FROM activity_groups WHERE activity_id = ? ORDER BY number",
            )
            .all(row.id) as Row[])
        : [myGroup(req, row.id)].filter((group): group is Row => !!group);
    const groups = groupRows.map((group): ActivityGroup => {
      const members = db
        .prepare(
          "SELECT u.id,u.name,a.avatar_id AS avatarId,EXISTS(SELECT 1 FROM memberships m WHERE m.classroom_id = ? AND m.student_id = u.id) AS active FROM activity_group_members gm JOIN users u ON u.id = gm.student_id LEFT JOIN user_avatars a ON a.user_id = u.id WHERE gm.group_id = ? ORDER BY u.name,u.id",
        )
        .all(row.classroom_id, group.id) as Row[];
      const rows = db
        .prepare(
          "SELECT s.id,s.version,s.created_at,s.link,s.note,s.file_id,u.name AS submitted_by FROM group_submissions s JOIN users u ON u.id = s.submitted_by WHERE s.group_id = ? ORDER BY s.version DESC",
        )
        .all(group.id) as Row[];
      return {
        id: group.id,
        number: group.number,
        representativeId: group.representative_id,
        members: members.map((member) => ({
          id: member.id,
          name: member.name,
          avatarId: member.avatarId ?? null,
          active: !!member.active,
        })),
        submissions: rows.map((entry): GroupSubmission => ({
          id: entry.id,
          version: entry.version,
          submittedAt: entry.created_at,
          submittedBy: entry.submitted_by,
          link: entry.link,
          note: entry.note,
          file: fileMeta(entry.file_id),
        })),
      };
    });
    const requirement = db
      .prepare(
        "SELECT id FROM activity_files WHERE activity_id = ? AND kind = 'requirement'",
      )
      .get(row.id) as Row | undefined;
    const history = db
      .prepare(
        "SELECT h.old_deadline_at,h.deadline_at,h.changed_at,h.reason,u.name AS changed_by FROM activity_deadline_history h JOIN users u ON u.id = h.changed_by WHERE h.activity_id = ? ORDER BY h.changed_at DESC,h.rowid DESC",
      )
      .all(row.id) as Row[];
    return {
      id: row.id,
      title: row.title,
      classroomId: row.classroom_id,
      classroomName: room.name,
      teacherName,
      instructions: row.instructions,
      requirementText: row.requirement_text,
      requirementFile: fileMeta(requirement?.id ?? null),
      deadlineAt: row.deadline_at,
      createdAt: row.created_at,
      groupCount: row.group_count,
      groups,
      extensions: history.map((entry) => ({
        oldDeadlineAt: entry.old_deadline_at,
        deadlineAt: entry.deadline_at,
        changedAt: entry.changed_at,
        changedBy: entry.changed_by,
        reason: entry.reason,
      })),
      serverNow: now(),
    };
  }

  app.get("/api/classrooms/:id/group-activities", (req: AppRequest, res) => {
    classroom(req, String(req.params.id));
    const rows = db
      .prepare(
        "SELECT id,title,deadline_at,group_count FROM group_activities WHERE classroom_id = ? ORDER BY created_at DESC,rowid DESC",
      )
      .all(String(req.params.id)) as Row[];
    res.json({
      activities: rows.map((row) => {
        const group =
          req.user!.role === "student" ? myGroup(req, row.id) : undefined;
        const submitted = db
          .prepare(
            "SELECT COUNT(DISTINCT s.group_id) AS n FROM group_submissions s JOIN activity_groups g ON g.id = s.group_id WHERE g.activity_id = ?",
          )
          .get(row.id) as Row;
        return {
          id: row.id,
          title: row.title,
          deadlineAt: row.deadline_at,
          groupCount: row.group_count,
          submittedGroups: req.user!.role === "teacher" ? submitted.n : 0,
          myGroupNumber: group?.number ?? null,
          hasSubmitted:
            !!group &&
            !!db
              .prepare(
                "SELECT 1 FROM group_submissions WHERE group_id = ? LIMIT 1",
              )
              .get(group.id),
        };
      }),
      serverNow: now(),
    });
  });
  app.post(
    "/api/classrooms/:id/group-activities",
    (req: AppRequest, _res, next) => {
      teacher(req);
      classroom(req, String(req.params.id));
      next();
    },
    upload("requirement", 5),
    (req: AppRequest, res) => {
      const classroomId = String(req.params.id);
      const title = text(req.body?.title, "Tên hoạt động", 200);
      const instructions = optionalText(
        req.body?.instructions,
        "Yêu cầu hoạt động",
        20000,
      );
      const deadlineAt = deadline(req.body?.deadlineAt);
      const groupCount = Number(req.body?.groupCount);
      if (!Number.isInteger(groupCount) || groupCount < 1)
        fail(400, "Số nhóm phải là số nguyên dương.");
      const requestId = text(req.body?.requestId, "Mã tạo hoạt động", 100);
      let metadata: ActivityFile | Omit<ActivityFile, "id"> | null = null;
      try {
        if (req.file) metadata = validateActivityFile(req.file, true);
      } catch (error) {
        fail(
          400,
          error instanceof Error ? error.message : "File Word không hợp lệ.",
        );
      }
      const fingerprint = hash(
        JSON.stringify({
          classroomId,
          title,
          instructions,
          deadlineAt,
          groupCount,
          file: req.file
            ? { filename: metadata!.filename, hash: hash(req.file.buffer) }
            : null,
        }),
      );
      const old = db
        .prepare("SELECT * FROM group_activities WHERE request_id = ?")
        .get(requestId) as Row | undefined;
      if (old) {
        if (old.classroom_id !== classroomId || old.fingerprint !== fingerprint)
          fail(409, "Mã tạo đã được dùng cho hoạt động khác.");
        return res.json(detail(req, old));
      }
      let requirementText = "";
      try {
        if (req.file) requirementText = requirementWordText(req.file.buffer);
      } catch {
        fail(
          400,
          "Không đọc được nội dung Word. Hãy lưu lại file .docx hợp lệ.",
        );
      }
      if (!instructions && !requirementText)
        fail(400, "Nhập yêu cầu hoặc chọn Word có nội dung văn bản.");
      if (deadlineAt <= now()) fail(400, "Hạn nộp phải ở tương lai.");
      const members = db
        .prepare(
          "SELECT u.id FROM memberships m JOIN users u ON u.id = m.student_id WHERE m.classroom_id = ? AND u.role = 'student' ORDER BY u.id",
        )
        .all(classroomId) as Row[];
      if (!members.length || groupCount > members.length)
        fail(
          400,
          "Số nhóm không được vượt số học sinh; lớp phải có ít nhất một học sinh.",
        );
      for (let i = members.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [members[i], members[j]] = [members[j], members[i]];
      }
      const id = randomUUID(),
        timestamp = now();
      db.exec("BEGIN");
      try {
        db.prepare(
          "INSERT INTO group_activities VALUES (?,?,?,?,?,?,?,?,?,?)",
        ).run(
          id,
          classroomId,
          title,
          instructions,
          requirementText,
          deadlineAt,
          timestamp,
          groupCount,
          requestId,
          fingerprint,
        );
        for (let number = 1; number <= groupCount; number++) {
          const groupId = randomUUID(),
            students = members.filter(
              (_member, index) => index % groupCount === number - 1,
            );
          db.prepare("INSERT INTO activity_groups VALUES (?,?,?,?)").run(
            groupId,
            id,
            number,
            students[0].id,
          );
          for (const member of students)
            db.prepare("INSERT INTO activity_group_members VALUES (?,?,?)").run(
              id,
              groupId,
              member.id,
            );
        }
        if (req.file)
          insertFile(
            req.file,
            id,
            null,
            "requirement",
            req.user!.id,
            timestamp,
          );
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      res.status(201).json(detail(req, activity(req, id)));
    },
  );
  app.get("/api/group-activities/:id", (req: AppRequest, res) =>
    res.json(detail(req, activity(req))),
  );
  app.post("/api/group-activities/:id/deadline", (req: AppRequest, res) => {
    teacher(req);
    const row = activity(req);
    const deadlineAt = deadline(req.body?.deadlineAt),
      expected = deadline(req.body?.expectedDeadlineAt);
    if (expected !== row.deadline_at)
      fail(
        409,
        "Hạn nộp đã được thay đổi. Hãy cập nhật hoạt động trước khi gia hạn.",
      );
    if (deadlineAt <= row.deadline_at || deadlineAt <= now())
      fail(400, "Hạn mới phải sau hạn cũ và ở tương lai.");
    const reason = optionalText(req.body?.reason, "Lý do gia hạn", 1000);
    db.exec("BEGIN");
    try {
      db.prepare(
        "UPDATE group_activities SET deadline_at = ? WHERE id = ?",
      ).run(deadlineAt, row.id);
      db.prepare(
        "INSERT INTO activity_deadline_history VALUES (?,?,?,?,?,?,?)",
      ).run(
        randomUUID(),
        row.id,
        row.deadline_at,
        deadlineAt,
        req.user!.id,
        now(),
        reason,
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.json(detail(req, activity(req)));
  });
  app.post(
    "/api/group-activities/:id/groups/:groupId/representative",
    (req: AppRequest, res) => {
      teacher(req);
      const row = activity(req);
      const group = db
        .prepare(
          "SELECT * FROM activity_groups WHERE id = ? AND activity_id = ?",
        )
        .get(String(req.params.groupId), row.id) as Row | undefined;
      if (!group) fail(404, "Không tìm thấy nhóm trong hoạt động.");
      if (req.body?.expectedRepresentativeId !== group.representative_id)
        fail(409, "Đại diện đã thay đổi. Hãy cập nhật hoạt động.");
      const userId = text(req.body?.studentId, "Đại diện nhóm", 100);
      if (
        !db
          .prepare(
            "SELECT 1 FROM activity_group_members g JOIN memberships m ON m.student_id = g.student_id AND m.classroom_id = ? WHERE g.group_id = ? AND g.student_id = ?",
          )
          .get(row.classroom_id, group.id, userId)
      )
        fail(400, "Chọn thành viên hiện còn trong lớp và thuộc nhóm này.");
      db.prepare(
        "UPDATE activity_groups SET representative_id = ? WHERE id = ?",
      ).run(userId, group.id);
      res.json(detail(req, activity(req)));
    },
  );
  app.post(
    "/api/group-activities/:id/submissions",
    (req: AppRequest, _res, next) => {
      student(req);
      activity(req);
      next();
    },
    upload("product", 10),
    (req: AppRequest, res) => {
      const row = activity(req),
        group = myGroup(req, row.id);
      if (!group) fail(403, "Bạn chưa được phân nhóm cho hoạt động này.");
      const requestId = text(req.body?.requestId, "Mã nộp bài", 100);
      const note = optionalText(req.body?.note, "Ghi chú", 3000);
      const rawLink = optionalText(req.body?.link, "Link sản phẩm", 2000);
      if (!!req.file === !!rawLink)
        fail(400, "Chọn một file hoặc một link sản phẩm.");
      let link: string | null = null,
        metadata: Omit<ActivityFile, "id"> | null = null;
      if (rawLink) {
        try {
          const url = new URL(rawLink);
          if (
            !["https:", "http:"].includes(url.protocol) ||
            !url.hostname ||
            url.username ||
            url.password
          )
            throw new Error();
          link = url.href;
        } catch {
          fail(
            400,
            "Link cần bắt đầu bằng http:// hoặc https://, ví dụ link chia sẻ Canva.",
          );
        }
      }
      try {
        if (req.file) metadata = validateActivityFile(req.file);
      } catch (error) {
        fail(
          400,
          error instanceof Error
            ? error.message
            : "File sản phẩm không hợp lệ.",
        );
      }
      const fingerprint = hash(
        JSON.stringify({
          groupId: group.id,
          link,
          note,
          file: req.file
            ? { filename: metadata!.filename, hash: hash(req.file.buffer) }
            : null,
        }),
      );
      const old = db
        .prepare("SELECT * FROM group_submissions WHERE request_id = ?")
        .get(requestId) as Row | undefined;
      if (old) {
        if (
          old.group_id !== group.id ||
          old.submitted_by !== req.user!.id ||
          old.fingerprint !== fingerprint
        )
          fail(409, "Mã nộp đã được dùng cho sản phẩm khác.");
        return res.json({
          id: old.id,
          version: old.version,
          submittedAt: old.created_at,
        });
      }
      if (group.representative_id !== req.user!.id)
        fail(
          403,
          "Chỉ đại diện nhóm được nộp bài. Nhờ giáo viên đổi đại diện nếu cần.",
        );
      const id = randomUUID();
      let version: number, timestamp: number;
      db.exec("BEGIN");
      try {
        timestamp = now();
        if (timestamp >= row.deadline_at)
          fail(410, "Đã hết hạn nộp. Chỉ giáo viên có thể gia hạn.");
        version =
          Number(
            (
              db
                .prepare(
                  "SELECT COALESCE(MAX(version),0) AS n FROM group_submissions WHERE group_id = ?",
                )
                .get(group.id) as Row
            ).n,
          ) + 1;
        const fileId = req.file
          ? insertFile(
              req.file,
              row.id,
              group.id,
              "submission",
              req.user!.id,
              timestamp,
            )
          : null;
        db.prepare(
          "INSERT INTO group_submissions VALUES (?,?,?,?,?,?,?,?,?,?)",
        ).run(
          id,
          group.id,
          req.user!.id,
          version,
          link,
          fileId,
          note,
          timestamp,
          requestId,
          fingerprint,
        );
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      res.status(201).json({ id, version, submittedAt: timestamp });
    },
  );
  app.get("/api/group-files/:id", (req: AppRequest, res) => {
    const file = db
      .prepare(
        "SELECT id,activity_id,group_id,kind,filename,mime FROM activity_files WHERE id = ?",
      )
      .get(String(req.params.id)) as Row | undefined;
    if (!file) fail(404, "Không tìm thấy file.");
    activity(req, file.activity_id);
    if (
      file.kind === "submission" &&
      req.user!.role === "student" &&
      myGroup(req, file.activity_id)?.id !== file.group_id
    )
      fail(403, "Bạn chỉ được tải sản phẩm của nhóm mình.");
    const content = (
      db
        .prepare("SELECT data FROM activity_files WHERE id = ?")
        .get(file.id) as Row
    ).data;
    res.attachment(file.filename).setHeader("Content-Type", file.mime);
    res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
    res.send(Buffer.from(content));
  });
}
