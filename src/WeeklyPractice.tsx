import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, errorMessage } from "./api";
import { Avatar } from "./Avatars";
import type {
  WeeklyPracticeData,
  WeeklyMember,
} from "../shared/weekly-practice";
import "./weekly-practice.css";

const date = (timestamp: number) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(timestamp);
const time = (seconds: number) =>
  `${Math.floor(seconds / 3600)} giờ ${Math.floor((seconds % 3600) / 60)} phút ${seconds % 60} giây`;

export function WeeklyPractice({
  classroomId,
  active,
}: {
  classroomId: string;
  active: boolean;
}) {
  const [data, setData] = useState<WeeklyPracticeData | null>(null);
  const [week, setWeek] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [unsupported, setUnsupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0),
    saving = useRef(false),
    initialized = useRef(false);
  const refresh = useCallback(async () => {
    if (saving.current) return;
    const ticket = ++generation.current;
    try {
      const result = await api<WeeklyPracticeData>(
        `/classrooms/${classroomId}/weekly-practice${week ? `?week=${encodeURIComponent(week)}` : ""}`,
      );
      if (ticket !== generation.current) return;
      setData(result);
      setError("");
      setUnsupported(false);
      if (!initialized.current) {
        setDraft(String(result.config.minutes));
        initialized.current = true;
      }
    } catch (e) {
      if (ticket !== generation.current) return;
      if (e instanceof ApiError && e.status === 404) setUnsupported(true);
      else setError(errorMessage(e));
    }
  }, [classroomId, week]);
  useEffect(() => {
    if (!active) return;
    void refresh();
    const update = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void refresh();
    };
    const timer = setInterval(update, 15000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      generation.current++;
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [active, refresh]);
  const value = Number(draft);
  const valid =
    draft.trim() !== "" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 9360;
  async function save() {
    if (!data || !valid || saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const ticket = ++generation.current;
    try {
      const result = await api<WeeklyPracticeData>(
        `/classrooms/${classroomId}/weekly-practice`,
        { minutes: value },
      );
      if (ticket !== generation.current) return;
      setData(result);
      setDraft(String(result.config.minutes));
      setWeek("");
      setNotice(
        `Đã lưu mức tối thiểu, áp dụng từ tuần bắt đầu ${result.config.effectiveWeek}.`,
      );
    } catch (e) {
      if (ticket === generation.current) setError(errorMessage(e));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const report = data?.report;
  function list(title: string, members: WeeklyMember[], complete: boolean) {
    return (
      <section
        className={`weekly-result ${complete ? "complete" : "incomplete"}`}
        aria-label={title}
      >
        <h3>
          {title} <span className="pill">{members.length}</span>
        </h3>
        {!members.length ? (
          <p className="muted">Chưa có học sinh trong danh sách này.</p>
        ) : (
          <ul>
            {members.map((m) => (
              <li key={m.id}>
                <Avatar name={m.name} />
                <div>
                  <strong>{m.name}</strong>
                  <p>Đã học {time(m.seconds)}</p>
                  {!complete && (
                    <small>Còn thiếu {time(m.remainingSeconds)}</small>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
  return (
    <section className="card weekly-practice" aria-labelledby="weekly-title">
      <h2 id="weekly-title">Luyện tập tối thiểu mỗi tuần</h2>
      <p>
        Tính từ 00:00 thứ Hai đến 12:00 trưa Chủ nhật, giờ Việt Nam. Cộng thời
        gian luyện tập, ôn và sửa sai được ghi nhận trong lớp/môn này; không
        tính thời gian làm kiểm tra.
      </p>
      {unsupported ? (
        <p role="status">Báo cáo tuần đang chờ cập nhật backend Railway.</p>
      ) : (
        <>
          <form
            aria-label="Thời gian luyện tập tối thiểu mỗi tuần"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <label htmlFor="weekly-minutes">
              Số phút tối thiểu mỗi học sinh mỗi tuần
            </label>
            <div className="weekly-form-row">
              <input
                id="weekly-minutes"
                name="weeklyMinutes"
                type="number"
                min={0}
                max={9360}
                step={1}
                required
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setNotice("");
                }}
                disabled={!data || busy}
                aria-describedby="weekly-policy"
              />
              <button
                className="button primary"
                disabled={
                  !data || busy || !valid || value === data.config.minutes
                }
              >
                {busy ? "Đang lưu…" : "Lưu thời gian tuần"}
              </button>
            </div>
            <p id="weekly-policy" className="muted">
              0 phút để tắt. Lần đầu áp dụng cho tuần hiện tại nếu chưa hết hạn;
              các thay đổi sau áp dụng từ tuần sau. Báo cáo cũ giữ mức đã giao.
            </p>
            {data?.config.effectiveWeek && (
              <p>
                Mức đã cài: <strong>{data.config.minutes} phút</strong> · từ
                tuần {data.config.effectiveWeek}.
              </p>
            )}
          </form>
          {notice && <p role="status">{notice}</p>}
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button
                type="button"
                disabled={busy}
                onClick={() => void refresh()}
              >
                Thử lại
              </button>
            </div>
          )}
          {!data && !error ? <p role="status">Đang tải báo cáo tuần…</p> : null}
          {data && data.weeks.length > 0 && (
            <label className="weekly-week">
              Tuần báo cáo
              <select
                value={week || data.report?.week || ""}
                disabled={busy}
                onChange={(e) => {
                  setWeek(e.target.value);
                  setData((d) => (d ? { ...d, report: null } : d));
                }}
              >
                {data.weeks.map((w) => (
                  <option key={w.week} value={w.week}>
                    Tuần {w.week}
                    {w.closed ? " · Đã kết thúc" : " · Đang diễn ra"}
                  </option>
                ))}
              </select>
            </label>
          )}
          {report ? (
            <>
              <p>
                <strong>
                  {report.closed
                    ? "Đã kết thúc tuần"
                    : "Tuần đang diễn ra · kết quả tạm tính"}
                </strong>
              </p>
              <p>
                {date(report.startsAt)} – {date(report.closesAt)} · Mức tối
                thiểu <strong>{report.minutes} phút/học sinh</strong>.
              </p>
              {report.coverageStart > report.startsAt && (
                <p className="muted">
                  Tuần đầu chưa có đủ lịch sử. Hệ thống chỉ có dữ liệu từ{" "}
                  {date(report.coverageStart)}; không dựng lại thời gian trước
                  đó.
                </p>
              )}
              <div className="weekly-results">
                {list("Đã hoàn thành", report.completed, true)}
                {list("Chưa hoàn thành", report.incomplete, false)}
              </div>
              <p className="muted">
                Sau 12:00 Chủ nhật không cộng thêm vào tuần này. Phiên bị xác
                nhận vi phạm muộn sẽ được loại khỏi báo cáo.
              </p>
            </>
          ) : data && data.weeks.length > 0 && !error ? (
            <p role="status">Đang tải báo cáo tuần…</p>
          ) : data && data.weeks.length === 0 ? (
            <p className="muted">
              {data.config.minutes > 0
                ? `Đã lên lịch theo dõi từ tuần ${data.config.effectiveWeek}. Báo cáo xuất hiện khi tuần bắt đầu.`
                : "Chưa có tuần được giao. Đặt mức tối thiểu lớn hơn 0 để bắt đầu theo dõi."}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
