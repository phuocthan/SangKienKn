import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Check, RotateCcw, Upload } from "lucide-react";
import {
  AVATARS,
  AVATAR_COLLECTIONS,
  findAvatar,
  type AvatarCollection,
  AVATAR_UPLOAD_LIMIT,
  AVATAR_MAX_DIMENSION,
  isUploadedAvatar,
  avatarCollectionsFor,
} from "../shared/avatars";
import { api, errorMessage } from "./api";
import type { User } from "./types";

export function Avatar({
  name,
  avatarId,
  className = "",
  imageUrl,
}: {
  name: string;
  avatarId?: string | null;
  className?: string;
  imageUrl?: string;
}) {
  const avatar = findAvatar(avatarId);
  const collection = avatar ? AVATAR_COLLECTIONS[avatar.collection] : undefined;
  const uploadedImage =
    imageUrl ??
    (isUploadedAvatar(avatarId) ? `/api/avatars/${avatarId}` : undefined);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={`avatar ${avatar || uploadedImage ? "avatar-art" : ""} ${className}`}
      aria-hidden="true"
      style={
        uploadedImage
          ? {
              backgroundImage: `url("${uploadedImage}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : avatar && collection
            ? {
                backgroundImage: `url(${collection.image})`,
                backgroundSize: `400% ${collection.rows * 100}%`,
                backgroundPosition: `${((avatar.tile % 4) * 100) / 3}% ${(Math.floor(avatar.tile / 4) * 100) / (collection.rows - 1)}%`,
              }
            : undefined
      }
    >
      {!avatar && !uploadedImage && initials}
    </span>
  );
}

export function AvatarPicker({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: (user: User) => void;
}) {
  const [selected, setSelected] = useState<string | null>(
    user.avatarId ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"all" | AvatarCollection>("all");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [reading, setReading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const ticket = useRef(0);
  useEffect(
    () => () => {
      ticket.current++;
    },
    [],
  );
  function clearUpload() {
    ticket.current++;
    setFile(null);
    setPreview("");
    setReading(false);
  }
  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const candidate = event.target.files?.[0];
    event.target.value = "";
    if (!candidate) return;
    clearUpload();
    setError("");
    setNotice("");
    if (!candidate.size || candidate.size > AVATAR_UPLOAD_LIMIT) {
      setError("Chọn ảnh tối đa 3 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(candidate.type)) {
      setError("Chọn ảnh JPG, PNG hoặc WebP.");
      return;
    }
    const currentTicket = ++ticket.current;
    setReading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(candidate);
      });
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      if (
        image.naturalWidth > AVATAR_MAX_DIMENSION ||
        image.naturalHeight > AVATAR_MAX_DIMENSION
      )
        throw new Error(
          `Ảnh tối đa ${AVATAR_MAX_DIMENSION} × ${AVATAR_MAX_DIMENSION} pixel.`,
        );
      if (ticket.current === currentTicket) {
        setFile(candidate);
        setPreview(dataUrl);
      }
    } catch (e) {
      if (ticket.current === currentTicket)
        setError(
          e instanceof Error && e.message.includes("pixel")
            ? e.message
            : "Không đọc được ảnh. Vui lòng chọn ảnh khác.",
        );
    } finally {
      if (ticket.current === currentTicket) setReading(false);
    }
  }
  useEffect(() => setSelected(user.avatarId ?? null), [user.avatarId]);
  const groups = avatarCollectionsFor(user.role);
  const availableAvatars = AVATARS.filter((avatar) =>
    groups.includes(avatar.collection),
  );
  const changed = !!file || selected !== (user.avatarId ?? null);
  async function save() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      let updated: User;
      if (file) {
        const body = new FormData();
        body.append("avatar", file);
        updated = await api<User>("/auth/avatar/upload", body);
      } else updated = await api<User>("/auth/avatar", { avatarId: selected });
      onUpdate(updated);
      setSelected(updated.avatarId ?? null);
      clearUpload();
      setNotice("Đã cập nhật avatar của bạn.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="avatar-picker" aria-labelledby="avatar-picker-title">
      <h2 id="avatar-picker-title">Avatar của bạn</h2>
      <p className="subtle-note">
        Chọn người bạn đồng hành cho hành trình GreenEdu.
      </p>
      <div className="avatar-preview">
        <Avatar
          name={user.name}
          avatarId={selected}
          imageUrl={preview || undefined}
          className="avatar-preview-art"
        />
        <div>
          <strong>
            {file
              ? "Ảnh bạn tải lên"
              : isUploadedAvatar(selected)
                ? "Ảnh cá nhân"
                : (findAvatar(selected)?.name ?? "Chữ viết tắt")}
          </strong>
          <p>Xem trước avatar</p>
        </div>
      </div>
      <div className="avatar-upload">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Chọn ảnh avatar"
          onChange={(event) => void chooseFile(event)}
          hidden
        />
        <div className="avatar-actions">
          <button
            className="button outline"
            type="button"
            disabled={saving || reading}
            onClick={() => input.current?.click()}
          >
            <Upload size={16} />
            {reading ? "Đang đọc ảnh…" : "Tải ảnh của bạn"}
          </button>
          {user.uploadedAvatarId && (
            <button
              className="button outline"
              type="button"
              disabled={saving || reading}
              onClick={() => {
                clearUpload();
                setSelected(user.uploadedAvatarId!);
                setError("");
                setNotice("");
              }}
            >
              Dùng ảnh đã tải
            </button>
          )}
          {file && (
            <button
              className="text-button"
              type="button"
              disabled={saving}
              onClick={clearUpload}
            >
              Hủy ảnh vừa chọn
            </button>
          )}
        </div>
        <p className="subtle-note">
          JPG, PNG hoặc WebP · tối đa 3 MB · tối đa 4096 × 4096 pixel. Chọn ảnh
          rồi bấm Lưu avatar.
        </p>
      </div>
      <div
        className="avatar-options"
        aria-label="Bộ sưu tập avatar"
        aria-busy={saving}
      >
        <div
          className="avatar-filters"
          role="group"
          aria-label="Lọc bộ sưu tập avatar"
        >
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Tất cả · {availableAvatars.length}
          </button>
          {groups.map((group) => (
            <button
              type="button"
              key={group}
              aria-pressed={filter === group}
              onClick={() => setFilter(group)}
            >
              {AVATAR_COLLECTIONS[group].name}
            </button>
          ))}
        </div>
        {groups
          .filter((group) => filter === "all" || filter === group)
          .map((group) => (
            <div key={group} className="avatar-collection">
              <h3>
                {AVATAR_COLLECTIONS[group].name}{" "}
                <span>
                  {AVATARS.filter((a) => a.collection === group).length} avatar
                </span>
              </h3>
              <div className="avatar-grid">
                {AVATARS.filter((a) => a.collection === group).map((avatar) => (
                  <button
                    type="button"
                    key={avatar.id}
                    className={`avatar-choice ${selected === avatar.id ? "selected" : ""}`}
                    aria-label={avatar.name}
                    aria-pressed={selected === avatar.id}
                    disabled={saving}
                    onClick={() => {
                      setSelected(avatar.id);
                      clearUpload();
                      setNotice("");
                      setError("");
                    }}
                  >
                    <Avatar
                      name={user.name}
                      avatarId={avatar.id}
                      className="avatar-choice-art"
                    />
                    <span>{avatar.name}</span>
                    {selected === avatar.id && (
                      <Check className="avatar-check" size={16} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <p className="avatar-saved" role="status">
          {notice}
        </p>
      )}
      <div className="avatar-actions">
        <button
          type="button"
          className="button primary"
          disabled={!changed || saving || reading}
          onClick={() => void save()}
        >
          {saving ? "Đang lưu…" : "Lưu avatar"}
        </button>
        <button
          type="button"
          className="button outline"
          disabled={saving || (selected === null && !file && !reading)}
          onClick={() => {
            setSelected(null);
            clearUpload();
            setNotice("");
          }}
        >
          <RotateCcw size={16} />
          Dùng chữ viết tắt
        </button>
      </div>
    </section>
  );
}
