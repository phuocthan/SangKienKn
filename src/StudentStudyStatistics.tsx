import { useEffect, useState } from "react";
import { api, ApiError, duration, errorMessage } from "./api";
import { Modal } from "./components";
import { Download } from "./icons";
import type { Classroom, Student } from "./types";
import {
  studyDate,
  type StudyBucket,
  type StudyPeriod,
  type StudyStatistics,
  type ClassroomStudyStatistics,
} from "../shared/study-statistics";
import "./study-statistics.css";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});
const dateLabel = (date: string) =>
  dateFormatter.format(new Date(`${date}T00:00:00+07:00`));
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
  students,
  initialStudentId = "",
  onClose,
}: {
  classroom: Classroom;
  students: Student[];
  initialStudentId?: string;
  onClose: () => void;
}) {
  const [period, setPeriod] = useState<StudyPeriod>("day");
  const [studentId, setStudentId] = useState(initialStudentId);
  const student = students.find((s) => s.id === studentId);
  const [date, setDate] = useState(() => studyDate(Date.now()));
  const [snapshot, setData] = useState<
    ClassroomStudyStatistics & { selectedStudentId: string }
  >();
  const data =
    snapshot?.selectedStudentId === studentId &&
    snapshot.period === period &&
    snapshot.date === date
      ? snapshot
      : undefined;
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
        const result = await api<StudyStatistics | ClassroomStudyStatistics>(
          `/classrooms/${classroom.id}${studentId ? `/students/${studentId}` : ""}/study-statistics?period=${period}&date=${date}`,
        );
        if (alive) {
          setData(
            "members" in result
              ? { ...result, selectedStudentId: studentId }
              : {
                  ...result,
                  selectedStudentId: studentId,
                  members: [
                    {
                      id: studentId,
                      name: student?.name ?? "Học sinh",
                      statistics: result,
                    },
                  ],
                },
          );
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
  }, [classroom.id, studentId, student?.name, period, date, retry]);
  function exportCsv() {
    if (!data || loading || error) return;
    const coverageLabel = {
      none: "Chưa có lịch sử",
      partial: "Lịch sử chưa đủ kỳ",
      full: "Đã theo dõi",
    };
    const periodLabel = { day: "Ngày", week: "Tuần", month: "Tháng" };
    const records: (string | number | null)[][] = [
      [
        "Lớp",
        "Môn",
        "Mã học sinh",
        "Học sinh",
        "Kỳ",
        "Ngày xem",
        "Từ ngày",
        "Đến ngày",
        "Thời gian (giây)",
        "Lịch sử",
        "Tổng ngày (giây)",
        "Tổng tuần (giây)",
        "Tổng tháng (giây)",
        "Tổng tích lũy (giây)",
        "Bắt đầu theo dõi (giờ Việt Nam)",
      ],
    ];
    for (const member of data.members) {
      for (const bucket of member.statistics.buckets.slice().reverse()) {
        records.push([
          classroom.name,
          classroom.subject,
          member.id,
          member.name,
          periodLabel[data.period],
          data.date,
          bucket.start,
          bucket.end,
          bucket.seconds,
          coverageLabel[bucket.coverage],
          member.statistics.summaries.day.seconds,
          member.statistics.summaries.week.seconds,
          member.statistics.summaries.month.seconds,
          member.statistics.lifetimeSeconds,
          new Date(member.statistics.trackingStartedAt).toLocaleString(
            "vi-VN",
            { timeZone: "Asia/Ho_Chi_Minh", hour12: false },
          ),
        ]);
      }
    }
    // Quoting protects delimiters; prefix spreadsheet formulas in user text.
    const csv =
      "\uFEFF" +
      records
        .map((row) =>
          row
            .map((value) => {
              const text = String(value ?? "");
              return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
            })
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `greenedu-thong-ke-${studentId || "ca-lop"}-${data.period}-${data.date}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const maximum = Math.max(
    1,
    ...(data?.buckets.map((bucket) => bucket.seconds ?? 0) ?? []),
  );
  return (
    <Modal
      title="Thống kê thời gian học"
      onClose={onClose}
      className={studentId ? "" : "study-statistics-modal"}
    >
      <div className="study-statistics">
        <p className="study-statistics-class">
          {classroom.name} · {classroom.subject}
        </p>
        <div className="study-statistics-filters">
          <label className="study-student-filter">
            Học sinh
            <select
              aria-label="Học sinh"
              name="statistics-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Tất cả học sinh</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.email}
                </option>
              ))}
            </select>
          </label>
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
              name="statistics-date"
              value={date}
              min="2000-01-01"
              max={studyDate(Date.now())}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
            />
          </label>
        </div>
        <div className="study-statistics-toolbar">
          <p>
            {student ? student.name : "Tất cả học sinh"}
            {data && !loading ? ` · ${data.members.length} học sinh` : ""}
          </p>
          <button
            type="button"
            className="button outline small"
            disabled={!data || loading || !!error || data.members.length === 0}
            onClick={exportCsv}
          >
            <Download size={16} /> Xuất CSV
          </button>
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
          <div className="loading-panel" role="status">
            Đang tải thống kê…
          </div>
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
              <details className="workspace-help">
                <summary>Cách tính thời gian</summary>
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
              </details>
              {!studentId &&
                (data.members.length ? (
                  <div className="table-scroll">
                    <table
                      className="study-statistics-table study-members-table"
                      aria-label="Thống kê từng học sinh"
                    >
                      <thead>
                        <tr>
                          <th scope="col">Học sinh</th>
                          <th scope="col">Ngày</th>
                          <th scope="col">Tuần</th>
                          <th scope="col">Tháng</th>
                          <th scope="col">Tích lũy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.members.map((member) => (
                          <tr key={member.id}>
                            <th scope="row">
                              <button
                                type="button"
                                className="text-button"
                                onClick={() => setStudentId(member.id)}
                              >
                                {member.name}
                              </button>
                            </th>
                            {(["day", "week", "month"] as const).map((p) => (
                              <td key={p}>
                                {timeLabel(
                                  member.statistics.summaries[p].seconds,
                                )}
                                {member.statistics.summaries[p].coverage ===
                                  "partial" && (
                                  <small>Lịch sử chưa đủ kỳ</small>
                                )}
                              </td>
                            ))}
                            <td>
                              {timeLabel(member.statistics.lifetimeSeconds)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p role="status">Lớp chưa có học sinh.</p>
                ))}
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
