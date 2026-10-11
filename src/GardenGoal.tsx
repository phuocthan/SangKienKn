import { ArrowRight, Flower2, Target } from "lucide-react";
import { studentLevel, STUDENT_LEVEL_NAMES } from "../shared/student-levels";
import { duration } from "./api";
import { StudentLevelIcon } from "./StudentLevel";
import type { Classroom } from "./types";

export function GardenGoal({
  classroom,
  onPractice,
}: {
  classroom: Classroom;
  onPractice: () => void;
}) {
  const seconds = classroom.chapters.reduce(
    (sum, chapter) => sum + chapter.seconds,
    0,
  );
  const stage = studentLevel(seconds);
  const flowers = classroom.chapters.filter(
    (chapter) => chapter.level === 5,
  ).length;
  return (
    <section className="card garden-goal" aria-label="Mục tiêu học tập kế tiếp">
      <div className="garden-goal-heading">
        <span className="goal-symbol">
          <Target size={24} />
        </span>
        <span className="eyebrow">TỪNG CHÚT MỖI NGÀY</span>
      </div>
      <h2>
        {stage.level === 5
          ? "Khu vườn đang lớn lên"
          : "Một bước nhỏ, thêm xanh"}
      </h2>
      <div className="garden-goal-stage">
        <StudentLevelIcon level={stage.level === 5 ? 5 : stage.level + 1} />
        <div>
          <strong>
            {stage.level === 5 ? "Kết Trái" : STUDENT_LEVEL_NAMES[stage.level]}
          </strong>
          <p>
            {stage.level === 5
              ? "Bạn đã đạt cấp cao nhất trong lớp này."
              : `Còn ${duration(stage.remainingSeconds)} để lên cấp kế tiếp.`}
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
        {duration(seconds)} đã học · {classroom.name}
      </small>
      <div className="garden-goal-flowers">
        <Flower2 size={17} /> {flowers}/{classroom.chapters.length} cây đã ra
        hoa
      </div>
      <button className="text-button" onClick={onPractice}>
        Bắt đầu một bước nhỏ <ArrowRight size={17} />
      </button>
    </section>
  );
}
