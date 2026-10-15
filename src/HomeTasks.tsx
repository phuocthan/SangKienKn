import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ClipboardList, Clock3, Users } from "./icons";
import { api } from "./api";
import type { Classroom } from "./types";
import type { LearningOverview } from "../shared/learning";
import type { GroupActivitySummary } from "../shared/group-activities";

type Destination = "groups" | "learning" | "online-exams" | "corrections";
type Task = {
  id: string;
  title: string;
  detail: string;
  page: Destination;
  due: number;
};

const deadline = (value: number) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

export function HomeTasks({
  classroom,
  teacher,
  onNavigate,
}: {
  classroom: Classroom;
  teacher: boolean;
  onNavigate: (page: Destination) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const ticket = ++sequence.current;
    const [groups, learning] = await Promise.allSettled([
      api<{ activities: GroupActivitySummary[]; serverNow: number }>(
        `/classrooms/${classroom.id}/group-activities`,
      ),
      api<LearningOverview>(`/classrooms/${classroom.id}/learning`),
    ]);
    if (ticket !== sequence.current) return;
    const next: Task[] = [];
    if (groups.status === "fulfilled") {
      for (const activity of groups.value.activities) {
        const pending = activity.groupCount - activity.submittedGroups;
        if (
          activity.deadlineAt <= groups.value.serverNow ||
          (teacher
            ? pending <= 0
            : activity.hasSubmitted || !activity.myGroupNumber)
        )
          continue;
        next.push({
          id: `group-${activity.id}`,
          title: activity.title,
          detail: `${teacher ? `${pending} nhóm chưa nộp · ` : "Nộp bài nhóm · "}${deadline(activity.deadlineAt)}`,
          page: "groups",
          due: activity.deadlineAt,
        });
      }
    }
    if (learning.status === "fulfilled") {
      const now = learning.value.serverNow ?? Date.now();
      for (const exam of learning.value.exams) {
        if (
          !exam.enabled ||
          exam.closesAt <= now ||
          (!teacher && exam.myRun?.status === "submitted")
        )
          continue;
        next.push({
          id: `exam-${exam.id}`,
          title: exam.title,
          detail: `${exam.startsAt > now ? "Bắt đầu" : "Kết thúc"} ${deadline(exam.startsAt > now ? exam.startsAt : exam.closesAt)}`,
          page: exam.delivery === "online" ? "online-exams" : "learning",
          due: exam.startsAt > now ? exam.startsAt : exam.closesAt,
        });
      }
      const pending = teacher
        ? learning.value.rewards.filter((reward) => reward.status === "pending")
            .length
        : 0;
      if (pending)
        next.push({
          id: "rewards",
          title: `${pending} điểm thưởng chờ duyệt`,
          detail: "Xem và duyệt đề xuất",
          page: "learning",
          due: Infinity,
        });
    }
    setTasks(next.sort((a, b) => a.due - b.due).slice(0, 3));
    setUnavailable(
      groups.status === "rejected" || learning.status === "rejected",
    );
    setLoading(false);
  }, [classroom.id, teacher]);
  useEffect(() => {
    void refresh();
    const update = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void refresh();
    };
    const timer = setInterval(update, 30000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    return () => {
      sequence.current++;
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
    };
  }, [refresh]);
  const corrections = classroom.chapters.reduce(
    (sum, chapter) => sum + chapter.openCorrections,
    0,
  );
  return (
    <section className="home-tasks" aria-label="Việc cần làm">
      <div className="home-tasks-heading">
        <h2>{teacher ? "Cần theo dõi" : "Việc cần làm"}</h2>
        {!teacher && corrections > 0 && (
          <button
            className="text-button"
            onClick={() => onNavigate("corrections")}
          >
            {corrections} câu cần sửa <ArrowRight size={16} />
          </button>
        )}
      </div>
      {loading ? (
        <p role="status">Đang tải việc cần làm…</p>
      ) : (
        <>
          {tasks.length > 0 ? (
            <div className="home-task-list">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  className="home-task"
                  onClick={() => onNavigate(task.page)}
                >
                  {task.page === "groups" ? (
                    <Users size={20} aria-hidden="true" />
                  ) : task.id === "rewards" ? (
                    <ClipboardList size={20} aria-hidden="true" />
                  ) : (
                    <Clock3 size={20} aria-hidden="true" />
                  )}
                  <span>
                    <strong>{task.title}</strong>
                    <small>{task.detail}</small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            !unavailable && <p>Chưa có bài sắp đến hạn.</p>
          )}
          {unavailable && (
            <p className="home-tasks-error" role="status">
              Chưa tải đủ danh sách.{" "}
              <button className="text-button" onClick={() => void refresh()}>
                Thử lại
              </button>
            </p>
          )}
        </>
      )}
    </section>
  );
}
