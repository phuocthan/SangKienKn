import { ArrowRight, Flower2, Target } from "./icons";
import { studentLevel, STUDENT_LEVEL_NAMES } from "../shared/student-levels";
import { duration } from "./api";
import { StudentLevelIcon } from "./StudentLevel";
import type { Chapter, Classroom } from "./types";

export function GardenGoal({
  classroom,
  onPractice,
}: {
  classroom: Classroom;
  onPractice: (chapter: Chapter) => void;
}) {
  const chapter = classroom.chapters
    .filter((item) => item.questionCount > 0 && item.practiceAllowed !== false)
    .sort((a, b) => {
      const left = studentLevel(a.seconds, a.levelMinutes),
        right = studentLevel(b.seconds, b.levelMinutes);
      return (
        Number(left.level === 5) - Number(right.level === 5) ||
        left.remainingSeconds - right.remainingSeconds
      );
    })[0];
  const seconds = chapter?.seconds ?? 0;
  const stage = studentLevel(seconds, chapter?.levelMinutes);
  const flowers = classroom.chapters.filter(
    (chapter) => chapter.level === 5,
  ).length;
  if (!chapter) {
    return (
      <section
        className="card garden-goal garden-goal-empty"
        aria-label="Mục tiêu học tập kế tiếp"
      >
        <span className="goal-symbol">
          <Target size={24} aria-hidden="true" />
        </span>
        <h2>Chưa có bài luyện tập mở</h2>
        <p>
          {classroom.chapters.some(
            (chapter) =>
              chapter.questionCount > 0 && chapter.practiceAllowed === false,
          )
            ? "Các chương đang khóa luyện tập. Chờ giáo viên mở lại."
            : classroom.chapters.length
              ? "Giáo viên đang chuẩn bị câu hỏi. Mục tiêu sẽ xuất hiện khi có bài luyện tập."
              : "Giáo viên sẽ thêm chương và câu hỏi để bạn bắt đầu."}
        </p>
      </section>
    );
  }
  return (
    <section className="card garden-goal" aria-label="Mục tiêu học tập kế tiếp">
      <div className="garden-goal-heading">
        <span className="goal-symbol">
          <Target size={24} aria-hidden="true" />
        </span>
        <h2>Mục tiêu tiếp theo</h2>
      </div>
      <div className="garden-goal-stage">
        <StudentLevelIcon level={stage.level === 5 ? 5 : stage.level + 1} />
        <div>
          <strong>
            {stage.level === 5 ? "Kết Trái" : STUDENT_LEVEL_NAMES[stage.level]}
          </strong>
          <p>
            {stage.level === 5
              ? "Đã đạt cấp cao nhất trong chương."
              : `Còn ${duration(stage.remainingSeconds)} để lên ${STUDENT_LEVEL_NAMES[stage.level]}.`}
          </p>
        </div>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Tiến độ mục tiêu kế tiếp"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={stage.progressPercent}
      >
        <span style={{ width: `${stage.progressPercent}%` }} />
      </div>
      <small>
        {duration(seconds)} đã học · {chapter?.title ?? "Chưa có chương học"}
      </small>
      <div className="garden-goal-flowers">
        <Flower2 size={17} aria-hidden="true" /> {flowers}/
        {classroom.chapters.length} cây đã Kết Trái
      </div>
      <button className="text-button" onClick={() => onPractice(chapter)}>
        Luyện tập <ArrowRight size={17} aria-hidden="true" />
      </button>
    </section>
  );
}
