import { useEffect, useState } from "react";
import { Clock3, Download, Trash2 } from "./icons";
import type { ExamDefinition, LearningOverview } from "../shared/learning";
import { api, errorMessage } from "./api";
import { ExamMetadata } from "./ExamMetadata";

type RunSummary = LearningOverview["runs"][number];
const date = (value: number) => new Date(value).toLocaleString("vi-VN");

export function OnlineExamGroups({
  data,
  teacher,
  busy,
  onStart,
  onClose,
  onDelete,
  onJoin,
  onOpen,
}: {
  data: LearningOverview;
  teacher: boolean;
  busy: boolean;
  onStart: (exam: ExamDefinition) => void;
  onClose: (exam: ExamDefinition) => void;
  onDelete: (exam: ExamDefinition) => void;
  onJoin: (exam: ExamDefinition) => void;
  onOpen: (id: string) => void;
}) {
  const [now, setNow] = useState(data.serverNow ?? Date.now());
  useEffect(() => {
    const received = performance.now();
    const serverNow = data.serverNow ?? Date.now();
    setNow(serverNow);
    const timer = window.setInterval(
      () => setNow(serverNow + performance.now() - received),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [data.serverNow]);
  const exams = data.exams.filter((exam) => exam.delivery === "online");
  return (
    <section
      className="card learning-section online-exam-list-section"
      aria-labelledby="online-exam-groups"
    >
      <h2 id="online-exam-groups">
        <Clock3 size={21} /> Các buổi kiểm tra online
      </h2>
      <p>
        {teacher
          ? "Đề đã lưu sẵn. Bắt đầu khi lớp sẵn sàng."
          : "Vào thi khi giáo viên mở đề. Xem kết quả sau khi buổi thi kết thúc."}
      </p>
      {!data.onlineExamGroups && (
        <p className="muted">
          Thống kê theo buổi và tải kết quả đang chờ cập nhật server.
        </p>
      )}
      {!exams.length && (
        <p className="muted">Chưa có buổi kiểm tra online cho lớp này.</p>
      )}
      <div className="online-exam-groups">
        {exams.map((exam) => (
          <ExamGroup
            key={exam.id}
            exam={exam}
            data={data}
            now={now}
            teacher={teacher}
            busy={busy}
            onStart={onStart}
            onClose={onClose}
            onDelete={onDelete}
            onJoin={onJoin}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}

function ExamGroup({
  exam,
  data,
  now,
  teacher,
  busy,
  onStart,
  onClose,
  onDelete,
  onJoin,
  onOpen,
}: {
  exam: ExamDefinition;
  data: LearningOverview;
  now: number;
  teacher: boolean;
  busy: boolean;
  onStart: (exam: ExamDefinition) => void;
  onClose: (exam: ExamDefinition) => void;
  onDelete: (exam: ExamDefinition) => void;
  onJoin: (exam: ExamDefinition) => void;
  onOpen: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const announced = exam.startedAt != null;
  const ended = announced && (!exam.enabled || now >= exam.closesAt);
  const running = announced && !ended && now >= exam.startsAt;
  const state = ended ? "Kết thúc" : running ? "Đang thi" : "Chuẩn bị";
  useEffect(() => {
    if (!expanded || !data.onlineExamGroups) return;
    let cancelled = false;
    setLoading(true);
    api<RunSummary[]>(`/learning/exams/${exam.id}/runs`)
      .then((rows) => {
        if (!cancelled) {
          setRuns(rows);
          setError("");
        }
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, data, exam.id]);
  const visibleRuns = runs ?? data.runs.filter((run) => run.examId === exam.id);
  const ownRun = exam.myRun ?? (!teacher ? visibleRuns[0] : null);
  return (
    <article
      className={`online-exam-group learning-row ${ended ? "is-ended" : running ? "is-running" : "is-preparing"}`}
      data-exam-id={exam.id}
    >
      <div className="online-exam-heading">
        <div>
          <strong className="online-exam-title">{exam.title}</strong>
          <ExamMetadata exam={exam} />
        </div>
        <span
          className={`online-exam-state ${ended ? "ended" : running ? "running" : "preparing"}`}
        >
          {state}
        </span>
      </div>
      <dl className="online-exam-facts">
        <div>
          <dt>Tham gia</dt>
          <dd>{exam.participants?.joined ?? "—"} học sinh</dd>
        </div>
        <div>
          <dt>Đã nộp</dt>
          <dd>{exam.participants?.submitted ?? "—"} học sinh</dd>
        </div>
        <div>
          <dt>Thời gian mở đề</dt>
          <dd>{announced ? date(exam.startsAt) : "Chưa ấn định"}</dd>
        </div>
        <div>
          <dt>Hạn kết thúc</dt>
          <dd>{announced ? date(exam.closesAt) : "Chưa ấn định"}</dd>
        </div>
      </dl>
      <div className="online-exam-controls">
        <small>
          {!announced
            ? "Chờ giáo viên bắt đầu"
            : ended
              ? "Buổi kiểm tra đã kết thúc."
              : !running
                ? "Đang chờ bắt đầu · Đã gửi thông báo cho lớp."
                : "Đề đang mở cho học sinh làm bài."}
        </small>
        <div className="learning-actions">
          {teacher ? (
            <>
              {!announced && (
                <button
                  className="button primary small"
                  disabled={busy || !data.onlineExams || !data.examCreation}
                  onClick={() => onStart(exam)}
                >
                  Bắt đầu kiểm tra
                </button>
              )}
              {announced && !ended && (
                <button
                  className="button danger small"
                  disabled={busy}
                  onClick={() => onClose(exam)}
                >
                  Đóng bài thi
                </button>
              )}
              {ended && data.onlineExamGroups && (
                <a
                  className="button secondary small"
                  href={`/api/learning/exams/${exam.id}/results.xlsx`}
                >
                  <Download size={16} /> Tải kết quả
                </a>
              )}
              <button
                type="button"
                className="button danger small"
                disabled={busy || !data.examDeletion || (announced && !ended)}
                onClick={() => onDelete(exam)}
              >
                <Trash2 size={16} /> Xóa bài kiểm tra
              </button>
            </>
          ) : ownRun ? (
            <button
              className="button secondary small"
              disabled={busy || (ownRun.status === "submitted" && !ended)}
              onClick={() => onOpen(ownRun.id)}
            >
              {ownRun.status === "active"
                ? "Tiếp tục thi"
                : ended
                  ? "Xem kết quả"
                  : "Đã nộp bài"}
            </button>
          ) : (
            <button
              className="button primary small"
              disabled={busy || !running || !!exam.blockedChapters?.length}
              onClick={() => onJoin(exam)}
            >
              {!announced
                ? "Chờ giáo viên bắt đầu"
                : ended
                  ? "Kết thúc"
                  : running
                    ? "Vào làm kiểm tra"
                    : "Chờ mở đề"}
            </button>
          )}
        </div>
      </div>
      {teacher && (!data.examDeletion || (announced && !ended)) && (
        <p className="muted">
          {!data.examDeletion
            ? "Xóa bài kiểm tra đang chờ cập nhật backend Railway."
            : "Đóng bài thi trước khi xóa."}
        </p>
      )}
      <details
        className="online-exam-results"
        onToggle={(event) => setExpanded(event.currentTarget.open)}
      >
        <summary>
          {teacher ? "Học sinh tham gia & bài nộp" : "Bài làm của bạn"}
        </summary>
        {error && <p role="alert">{error}</p>}
        {loading && runs === null && <p className="muted">Đang tải bài làm…</p>}
        {!visibleRuns.length && !loading && !error && (
          <p className="muted">
            {teacher
              ? "Chưa có học sinh tham gia."
              : "Bạn chưa tham gia buổi này."}
          </p>
        )}
        {visibleRuns.map((run) => (
          <div className="online-exam-result" key={run.id}>
            <div>
              <strong>{teacher ? run.studentName : "Bài làm của bạn"}</strong>
              <p>
                {run.status === "active" ? "Đang làm" : "Đã nộp"} ·{" "}
                {teacher || ended
                  ? run.score == null
                    ? "Chưa có điểm"
                    : `${run.score.toFixed(1)} / 10`
                  : "Chờ công bố điểm"}{" "}
                · {run.warnings} lần rời tab
              </p>
            </div>
            <button
              className="button secondary small"
              disabled={!teacher && run.status === "submitted" && !ended}
              onClick={() => onOpen(run.id)}
            >
              {!teacher && run.status === "active" ? "Tiếp tục thi" : "Xem bài"}
            </button>
          </div>
        ))}
      </details>
    </article>
  );
}
