import type { Express } from "express";
import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import multer from "multer";
import type { AppRequest, Row } from "./app.js";
import {
  AVATAR_MAX_DIMENSION,
  AVATAR_UPLOAD_LIMIT,
} from "../shared/avatars.js";

// Inspect raster headers; never trust the filename or client-provided MIME type.
export function avatarImage(data: Buffer) {
  let mime = "",
    width = 0,
    height = 0;
  if (
    data.length >= 45 &&
    data
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    data.toString("ascii", 12, 16) === "IHDR" &&
    data.readUInt32BE(8) === 13 &&
    data.toString("ascii", data.length - 8, data.length - 4) === "IEND"
  ) {
    mime = "image/png";
    width = data.readUInt32BE(16);
    height = data.readUInt32BE(20);
  } else if (
    data.length >= 12 &&
    data[0] === 255 &&
    data[1] === 216 &&
    data[data.length - 2] === 255 &&
    data[data.length - 1] === 217
  ) {
    let offset = 2;
    while (offset + 4 <= data.length) {
      if (data[offset++] !== 255) break;
      while (data[offset] === 255) offset++;
      const marker = data[offset++];
      if (marker === 218 || marker === 217) break;
      const length = data.readUInt16BE(offset);
      if (length < 2 || offset + length > data.length) break;
      if ([192, 193, 194].includes(marker) && length >= 8) {
        mime = "image/jpeg";
        height = data.readUInt16BE(offset + 3);
        width = data.readUInt16BE(offset + 5);
        break;
      }
      offset += length;
    }
  } else if (
    data.length >= 30 &&
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP" &&
    data.readUInt32LE(4) + 8 === data.length
  ) {
    const chunk = data.toString("ascii", 12, 16);
    if (chunk === "VP8X" && !(data[20] & 2)) {
      width = 1 + data.readUIntLE(24, 3);
      height = 1 + data.readUIntLE(27, 3);
    } else if (
      chunk === "VP8 " &&
      data.subarray(23, 26).equals(Buffer.from([157, 1, 42]))
    ) {
      width = data.readUInt16LE(26) & 0x3fff;
      height = data.readUInt16LE(28) & 0x3fff;
    } else if (chunk === "VP8L" && data[20] === 47) {
      const bits = data.readUInt32LE(21);
      width = (bits & 0x3fff) + 1;
      height = ((bits >>> 14) & 0x3fff) + 1;
    }
    if (width && height) mime = "image/webp";
  }
  if (!mime || !width || !height)
    throw new Error("Ảnh không hợp lệ. Chọn ảnh JPG, PNG hoặc WebP.");
  if (width > AVATAR_MAX_DIMENSION || height > AVATAR_MAX_DIMENSION)
    throw new Error(
      `Ảnh tối đa ${AVATAR_MAX_DIMENSION} × ${AVATAR_MAX_DIMENSION} pixel.`,
    );
  return mime;
}

export function registerAvatarUploads(
  app: Express,
  db: DatabaseSync,
  publicUser: (user: Row) => unknown,
  fail: (status: number, message: string) => never,
) {
  const receive = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: AVATAR_UPLOAD_LIMIT, files: 1, fields: 0, parts: 2 },
  }).single("avatar");
  app.post(
    "/api/auth/avatar/upload",
    (req, res, next) => {
      if (!req.is("multipart/form-data"))
        return fail(415, "Vui lòng chọn một file ảnh.");
      receive(req, res, (error: unknown) => {
        if (error)
          return res
            .status(
              error instanceof multer.MulterError &&
                error.code === "LIMIT_FILE_SIZE"
                ? 413
                : 400,
            )
            .json({
              error:
                error instanceof multer.MulterError &&
                error.code === "LIMIT_FILE_SIZE"
                  ? "Ảnh vượt quá 3 MB."
                  : "Chỉ tải một file ảnh avatar.",
            });
        next();
      });
    },
    (req: AppRequest, res) => {
      if (!req.file) return fail(400, "Vui lòng chọn một file ảnh.");
      let mime: string;
      try {
        mime = avatarImage(req.file.buffer);
      } catch (error) {
        return fail(
          400,
          error instanceof Error ? error.message : "Ảnh không hợp lệ.",
        );
      }
      const id = `upload-${randomUUID()}`;
      db.exec("BEGIN");
      try {
        db.prepare(
          "INSERT INTO avatar_uploads (id,user_id,mime,data) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET id=excluded.id,mime=excluded.mime,data=excluded.data",
        ).run(id, req.user!.id, mime, req.file.buffer);
        db.prepare(
          "INSERT INTO user_avatars (user_id,avatar_id) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET avatar_id=excluded.avatar_id",
        ).run(req.user!.id, id);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      res.json(publicUser(req.user!));
    },
  );
  app.get("/api/avatars/:id", (req: AppRequest, res) => {
    const image = db
      .prepare("SELECT * FROM avatar_uploads WHERE id=?")
      .get(String(req.params.id)) as Row | undefined;
    if (!image) return fail(404, "Không tìm thấy avatar.");
    const viewer = req.user!;
    const sharedClass = db
      .prepare(
        `SELECT 1 FROM classrooms c
      WHERE (c.teacher_id=? OR EXISTS(SELECT 1 FROM memberships m WHERE m.classroom_id=c.id AND m.student_id=?))
        AND (c.teacher_id=? OR EXISTS(SELECT 1 FROM memberships m WHERE m.classroom_id=c.id AND m.student_id=?))`,
      )
      .get(viewer.id, viewer.id, image.user_id, image.user_id);
    if (viewer.id !== image.user_id && viewer.role !== "admin" && !sharedClass)
      return fail(404, "Không tìm thấy avatar.");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.type(image.mime).send(Buffer.from(image.data));
  });
}
