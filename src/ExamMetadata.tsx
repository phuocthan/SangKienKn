import { BookOpen, Clock3, ShieldCheck } from "./icons";
import type { ExamDefinition } from "../shared/learning";

/** Shared summary keeps exam rules visible for both roles, without color-only cues. */
export function ExamMetadata({ exam }: { exam: ExamDefinition }) {
  return (
    <ul className="exam-metadata" aria-label="Thông tin bài kiểm tra">
      <li className="exam-meta-questions">
        <BookOpen size={18} />
        <span>
          <strong>{exam.questionCount}</strong> câu
        </span>
      </li>
      {exam.delivery === "online" && (
        <>
          <li className="exam-meta-wait">
            <Clock3 size={18} />
            <span>
              Chờ <strong>{exam.preparationMinutes}</strong> phút
            </span>
          </li>
          <li className="exam-meta-duration">
            <Clock3 size={18} />
            <span>
              Làm bài <strong>{exam.durationMinutes}</strong> phút
            </span>
          </li>
        </>
      )}
      <li className="exam-meta-rule">
        <ShieldCheck size={18} />
        <span>
          Tự nộp ở lần rời tab <strong>{exam.tabLimit}</strong>
        </span>
      </li>
      {exam.progressChapterTitle && (
        <li className="exam-meta-duration">
          <Clock3 size={18} />
          <span>Cộng giờ: {exam.progressChapterTitle}</span>
        </li>
      )}
    </ul>
  );
}
