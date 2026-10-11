import type { Express } from "express";
import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import type { AppRequest, Row } from "./app.js";
import type { FeedbackThread } from "../shared/feedback.js";

export function ensureFeedbackSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback_threads (
      id TEXT PRIMARY KEY, classroom_id TEXT NOT NULL REFERENCES classrooms(id),
      student_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('new','replied','closed')),
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      request_id TEXT NOT NULL, UNIQUE(student_id,request_id)
    );
    CREATE TABLE IF NOT EXISTS feedback_messages (
      id TEXT PRIMARY KEY, thread_id TEXT NOT NULL REFERENCES feedback_threads(id),
      author_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL,
      created_at INTEGER NOT NULL, request_id TEXT NOT NULL,
      UNIQUE(author_id,request_id)
    );
    CREATE INDEX IF NOT EXISTS feedback_classroom ON feedback_threads(classroom_id,updated_at);
    CREATE INDEX IF NOT EXISTS feedback_thread_messages ON feedback_messages(thread_id,created_at);
  `);
}
export function registerFeedbackRoutes(
  app: Express,
  db: DatabaseSync,
  context: {
    now: () => number;
    text: (value: unknown, label: string, max?: number) => string;
    fail: (status: number, message: string) => never;
    classroom: (req: AppRequest, id: string) => Row;
    student: (req: AppRequest) => void;
    teacher: (req: AppRequest) => void;
  },
) {
  const { now, text, classroom, student, teacher } = context;
  const fail: typeof context.fail = context.fail;
  function thread(req: AppRequest) {
    const row = db
      .prepare("SELECT * FROM feedback_threads WHERE id=?")
      .get(String(req.params.id)) as Row | undefined;
    if (!row) fail(404, "Không tìm thấy góp ý.");
    classroom(req, row.classroom_id);
    if (req.user!.role !== "teacher" && row.student_id !== req.user!.id)
      fail(403, "Bạn chỉ được xem góp ý của mình.");
    return row;
  }
  function detail(row: Row): FeedbackThread {
    const messages = db
      .prepare(
        `SELECT m.id,m.author_id AS authorId,u.name AS authorName,
      u.role AS authorRole,m.body,m.created_at AS createdAt FROM feedback_messages m
      JOIN users u ON u.id=m.author_id WHERE thread_id=? ORDER BY m.created_at,m.rowid`,
      )
      .all(row.id);
    return {
      id: row.id,
      studentId: row.student_id,
      studentName: String(
        db.prepare("SELECT name FROM users WHERE id=?").get(row.student_id)!
          .name,
      ),
      title: row.title,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messages: messages as FeedbackThread["messages"],
    };
  }
  app.get("/api/classrooms/:id/feedback", (req: AppRequest, res) => {
    classroom(req, String(req.params.id));
    const rows = db
      .prepare(
        `SELECT * FROM feedback_threads WHERE classroom_id=?
      AND (?='teacher' OR student_id=?) ORDER BY updated_at DESC,rowid DESC`,
      )
      .all(String(req.params.id), req.user!.role, req.user!.id) as Row[];
    res.json({ threads: rows.map(detail) });
  });
  app.post("/api/classrooms/:id/feedback", (req: AppRequest, res) => {
    student(req);
    const room = classroom(req, String(req.params.id));
    const title = text(req.body?.title, "Tiêu đề góp ý", 160);
    const body = text(req.body?.body, "Nội dung góp ý", 5000);
    const requestId = text(req.body?.requestId, "Mã gửi góp ý", 100);
    const old = db
      .prepare(
        "SELECT * FROM feedback_threads WHERE student_id=? AND request_id=?",
      )
      .get(req.user!.id, requestId) as Row | undefined;
    if (old) {
      const first = db
        .prepare(
          "SELECT body FROM feedback_messages WHERE thread_id=? ORDER BY rowid LIMIT 1",
        )
        .get(old.id);
      if (
        old.classroom_id !== room.id ||
        old.title !== title ||
        first?.body !== body
      )
        fail(409, "Mã gửi đã được dùng cho góp ý khác.");
      return res.json(detail(old));
    }
    const id = randomUUID(),
      timestamp = now();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO feedback_threads VALUES(?,?,?,?,?,?,?,?)").run(
        id,
        room.id,
        req.user!.id,
        title,
        "new",
        timestamp,
        timestamp,
        requestId,
      );
      db.prepare("INSERT INTO feedback_messages VALUES(?,?,?,?,?,?)").run(
        randomUUID(),
        id,
        req.user!.id,
        body,
        timestamp,
        randomUUID(),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res
      .status(201)
      .json(
        detail(
          db.prepare("SELECT * FROM feedback_threads WHERE id=?").get(id)!,
        ),
      );
  });
  app.post("/api/feedback/:id/messages", (req: AppRequest, res) => {
    const row = thread(req);
    const body = text(req.body?.body, "Nội dung phản hồi", 5000);
    const requestId = text(req.body?.requestId, "Mã phản hồi", 100);
    const old = db
      .prepare(
        "SELECT * FROM feedback_messages WHERE author_id=? AND request_id=?",
      )
      .get(req.user!.id, requestId) as Row | undefined;
    if (old) {
      if (old.thread_id !== row.id || old.body !== body)
        fail(409, "Mã gửi đã được dùng cho phản hồi khác.");
      return res.json(detail(row));
    }
    if (row.status === "closed")
      fail(409, "Góp ý đã xử lý. Giáo viên cần mở lại để tiếp tục trao đổi.");
    const timestamp = now();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO feedback_messages VALUES(?,?,?,?,?,?)").run(
        randomUUID(),
        row.id,
        req.user!.id,
        body,
        timestamp,
        requestId,
      );
      db.prepare(
        "UPDATE feedback_threads SET status=?,updated_at=? WHERE id=?",
      ).run(
        req.user!.role === "teacher" ? "replied" : "new",
        timestamp,
        row.id,
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.status(201).json(detail(thread(req)));
  });
  app.post("/api/feedback/:id/status", (req: AppRequest, res) => {
    teacher(req);
    const row = thread(req),
      status = req.body?.status;
    if (!["new", "closed"].includes(status))
      fail(400, "Trạng thái góp ý không hợp lệ.");
    db.prepare(
      "UPDATE feedback_threads SET status=?,updated_at=? WHERE id=?",
    ).run(status, now(), row.id);
    res.json(detail(thread(req)));
  });
}
