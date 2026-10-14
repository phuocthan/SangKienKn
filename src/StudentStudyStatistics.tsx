import { useEffect, useState } from "react";
import { api, ApiError, duration, errorMessage } from "./api";
import { Modal } from "./components";
import type { Classroom, Student } from "./types";
import {
  studyDate,
  type StudyBucket,
  type StudyPeriod,
  type StudyStatistics,
} from "../shared/study-statistics";
import "./study-statistics.css";

const dateLabel = (date: string) =>
  `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
const timeLabel = (seconds: number | null) =>
  seconds === null
    ? "Chưa có lịch sử"
    : `${duration(seconds)} ${seconds % 60} giây`;
const rangeLabel = (bucket: StudyBucket) =>
  bucket.start === bucket.end
    ? dateLabel(bucket.start)
    : `${dateLabel(bucket.start)} – ${dateLabel(bucket.end)}`;

export function StudentStudyStatistics({
  classroom,
  student,
  onClose,
}: {
  classroom: Classroom;
  student: Student;
  onClose: () => void;
}) {
  const [period, setPeriod] = useState<StudyPeriod>("day");
  const [date, setDate] = useState(() => studyDate(Date.now()));
  const [data, setData] = useState<StudyStatistics>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true,
      inFlight = false;
    setData(undefined);
    setLoading(true);
    setError("");
    async function refresh() {
      if (!alive || inFlight || document.hidden) return;
      if (!navigator.onLine) {
        setError("Mất kết nối. Thống kê đang giữ dữ liệu đã xác nhận.");
        setLoading(false);
        return;
      }
      inFlight = true;
      try {
        const result = await api<StudyStatistics>(
          `/classrooms/${classroom.id}/students/${student.id}/study-statistics?period=${period}&date=${date}`,
        );
        if (alive) {
          setData(result);
          setError("");
        }
      } catch (problem) {
        if (alive)
          setError(
            problem instanceof ApiError && problem.status === 404
              ? "Thống kê chưa sẵn sàng. Cần cập nhật máy chủ hoặc kiểm tra học sinh còn trong lớp."
              : errorMessage(problem),
          );
      } finally {
        inFlight = false;
        if (alive) setLoading(false);
      }
    }
    void refresh();
    const update = () => void refresh();
    const offline = () =>
      setError("Mất kết nối. Thống kê đang giữ dữ liệu đã xác nhận.");
    const timer = window.setInterval(update, 5000);
    window.addEventListener("online", update);
    window.addEventListener("offline", offline);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", offline);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [classroom.id, student.id, period, date, retry]);
  const maximum = Math.max(
    1,
    ...(data?.buckets.map((bucket) => bucket.seconds ?? 0) ?? []),
  );
  return (
    <Modal title={`Thống kê thời gian học · ${student.name}`} onClose={onClose}>
      <div className="study-statistics">
        <p className="study-statistics-class">
          {classroom.name} · {classroom.subject}
        </p>
        <div className="study-statistics-filters">
          <div
            className="study-periods"
            role="group"
            aria-label="Khoảng thống kê"
          >
            {(
              [
                ["day", "Ngày"],
                ["week", "Tuần"],
                ["month", "Tháng"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`button small ${period === value ? "primary" : "outline"}`}
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <label>
            Ngày xem
            <input
              type="date"
              value={date}
              min="2000-01-01"
              max={studyDate(Date.now())}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
            />
          </label>
        </div>
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button type="button" onClick={() => setRetry((n) => n + 1)}>
              Thử lại
            </button>
          </div>
        )}
        {loading ? (
          <div className="loading-panel">Đang tải thống kê…</div>
        ) : (
          data && (
            <>
              <dl className="study-statistics-summary">
                {(
                  [
                    ["day", "Ngày đã chọn"],
                    ["week", "Tuần chứa ngày đã chọn"],
                    ["month", "Tháng chứa ngày đã chọn"],
                  ] as const
                ).map(([value, label]) => (
                  <div key={value}>
                    <dt>{label}</dt>
                    <dd>{timeLabel(data.summaries[value].seconds)}</dd>
                    {data.summaries[value].coverage === "partial" && (
                      <small>Lịch sử chưa đủ kỳ</small>
                    )}
                  </div>
                ))}
              </dl>
              <p className="study-statistics-note">
                Tổng tích lũy:{" "}
                <strong>{timeLabel(data.lifetimeSeconds)}</strong>. Lịch sử từ{" "}
                {new Date(data.trackingStartedAt).toLocaleString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                  hour12: false,
                })}
                . Thời gian cũ chưa được chia theo ngày. Tuần bắt đầu thứ Hai,
                theo giờ Việt Nam.
              </p>
              <div className="table-scroll">
                <table
                  className="study-statistics-table"
                  aria-label="Thời gian luyện tập theo kỳ"
                >
                  <thead>
                    <tr>
                      <th scope="col">
                        {period === "day"
                          ? "Ngày"
                          : period === "week"
                            ? "Tuần"
                            : "Tháng"}
                      </th>
                      <th scope="col">Thời gian luyện tập</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.buckets
                      .slice()
                      .reverse()
                      .map((bucket) => (
                        <tr key={bucket.start}>
                          <th scope="row">{rangeLabel(bucket)}</th>
                          <td>
                            <span>{timeLabel(bucket.seconds)}</span>
                            {bucket.seconds !== null && bucket.seconds > 0 && (
                              <div
                                className="study-time-bar"
                                aria-hidden="true"
                              >
                                <span
                                  style={{
                                    width: `${(bucket.seconds / maximum) * 100}%`,
                                  }}
                                />
                              </div>
                            )}
                            {bucket.coverage === "partial" && (
                              <small>Lịch sử chưa đủ kỳ</small>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </div>
    </Modal>
  );
}
