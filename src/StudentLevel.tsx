import { useId } from "react";
import { LevelArtwork } from "./LevelArtwork";
import { Check, CheckCircle2, LockKeyhole } from "./icons";
import { STUDENT_LEVEL_NAMES, studentLevel } from "../shared/student-levels";
import type { Chapter, Classroom, Student } from "./types";
import { duration } from "./api";

export function StudentLevelIcon({
  level,
  className = "",
  label,
}: {
  level: number;
  className?: string;
  label?: string;
}) {
  const stage = Math.max(1, Math.min(5, Math.floor(level)));
  return (
    <svg
      viewBox="0 0 80 80"
      className={`student-level-icon ${className}`}
      role="img"
      aria-label={label ?? `Cấp ${stage} · ${STUDENT_LEVEL_NAMES[stage - 1]}`}
      data-icon-family="greenedu-duotone"
      data-level={stage}
    >
      <LevelArtwork stage={stage} />
    </svg>
  );
}

export function ChapterTitle({ title }: { title: string }) {
  const short =
    title.match(
      /^(Chương\s+(?:[IVXLCDM]+|\d+))(?=\s*(?:[:·.\-–—]|$))/iu,
    )?.[1] ?? title;
  return (
    <h3 title={title} aria-label={title}>
      {short}
    </h3>
  );
}

export function BloomingTreeIcon() {
  return (
    <span className="blooming-tree-icon" aria-hidden="true">
      <StudentLevelIcon level={4} />
      <svg className="blooming-tree-plus" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="9" fill="#326145" />
        <path
          d="M10 5v10M5 10h10"
          fill="none"
          stroke="#fff8e9"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function StudentLevelBadge({
  seconds,
  levelMinutes,
  scope = "",
  compact = false,
}: {
  seconds: number;
  levelMinutes?: number;
  scope?: string;
  compact?: boolean;
}) {
  const stage = studentLevel(seconds, levelMinutes);
  return (
    <span
      className={`student-level-badge ${compact ? "compact" : ""}`}
      data-level={stage.level}
      title={`Cấp ${stage.level} · ${stage.name}${scope ? ` · ${scope}` : ""}`}
    >
      <StudentLevelIcon level={stage.level} />
      <span>
        Cấp {stage.level} · {stage.name}
      </span>
    </span>
  );
}

export function ChapterLevelIcons({
  chapters,
}: {
  chapters?: Student["chapterLevels"];
}) {
  if (!chapters?.length) return null;
  return (
    <span
      className="chapter-level-icons"
      role="list"
      aria-label="Cấp độ theo thứ tự chương"
    >
      {chapters.map((chapter) => {
        const stage = studentLevel(chapter.seconds, chapter.levelMinutes);
        const label = `${chapter.chapterTitle}: Cấp ${stage.level} · ${stage.name}`;
        return (
          <span
            className="chapter-level-icon-item"
            role="listitem"
            key={chapter.chapterId}
            title={label}
            data-chapter-id={chapter.chapterId}
            data-level={stage.level}
          >
            <StudentLevelIcon level={stage.level} label={label} />
          </span>
        );
      })}
    </span>
  );
}

export function ChapterLevelTimeline({ chapter }: { chapter: Chapter }) {
  const journeyId = useId();
  const stage = studentLevel(chapter.seconds, chapter.levelMinutes);
  const maximum = 4 * (chapter.levelMinutes ?? 60) * 60;
  const percent = Math.min(100, (stage.seconds / maximum) * 100);
  return (
    <div
      className="chapter-level-timeline"
      data-chapter-id={chapter.id}
      data-level={stage.level}
    >
      <div className="chapter-level-roadmap">
        <ol
          className="chapter-level-milestones"
          aria-label={`Mốc cấp độ ${chapter.title}`}
        >
          {STUDENT_LEVEL_NAMES.map((name, index) => (
            <li
              key={name}
              style={{ left: `${index * 20}%` }}
              className={
                index + 1 === stage.level
                  ? "current"
                  : index + 1 < stage.level
                    ? "earned"
                    : "locked"
              }
              aria-current={index + 1 === stage.level ? "step" : undefined}
            >
              <StudentLevelIcon level={index + 1} />
              {index === 4 && stage.level === 5 && (
                <span
                  className="level-completion-mark"
                  title="Đã hoàn thành chương"
                  aria-label="Đã hoàn thành chương"
                >
                  <CheckCircle2 size={18} />
                </span>
              )}
              {index + 1 !== stage.level && (
                <span
                  className="level-state-mark"
                  aria-hidden="true"
                  title={index + 1 < stage.level ? "Đã đạt" : "Chưa đạt"}
                >
                  {index + 1 < stage.level ? (
                    <Check size={10} />
                  ) : (
                    <LockKeyhole size={10} />
                  )}
                </span>
              )}
              <span>{name}</span>
              <small>
                {duration(index * (chapter.levelMinutes ?? 60) * 60)}
              </small>
            </li>
          ))}
        </ol>
        <div
          className="chapter-level-rail"
          role="progressbar"
          aria-label={`Tiến độ ${chapter.title}`}
          aria-valuemin={0}
          aria-valuemax={maximum}
          aria-valuenow={Math.min(stage.seconds, maximum)}
          aria-valuetext={`${duration(stage.seconds)} · Cấp ${stage.level} · ${stage.name}`}
        >
          <svg
            className="chapter-level-path"
            viewBox="0 0 1000 64"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={journeyId}>
                <stop stopColor="#b75e2b" />
                <stop offset="1" stopColor="#f5b932" />
              </linearGradient>
              <clipPath id={`${journeyId}-fill`} clipPathUnits="userSpaceOnUse">
                <rect x={-5} y={-10} width={percent * 10 + 5} height={84} />
              </clipPath>
            </defs>
            <path
              className="journey-path-base"
              d="M0 8C125 8 125 56 250 56C375 56 375 8 500 8C625 8 625 56 750 56C875 56 875 8 1000 8"
              vectorEffect="non-scaling-stroke"
            />
            {percent > 0 && (
              <path
                className="journey-path-fill"
                d="M0 8C125 8 125 56 250 56C375 56 375 8 500 8C625 8 625 56 750 56C875 56 875 8 1000 8"
                stroke={`url(#${journeyId})`}
                clipPath={`url(#${journeyId}-fill)`}
                data-progress-percent={percent}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          {STUDENT_LEVEL_NAMES.map((name, index) => (
            <span
              key={name}
              className={`chapter-level-tick ${index + 1 <= stage.level ? "earned" : ""}`}
              style={{
                left: `${index * 25}%`,
                top: `${((index % 2 ? 56 : 8) / 64) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="chapter-level-summary">
        <span
          className={
            stage.seconds > maximum ? "chapter-time-exceeded" : undefined
          }
          title={
            stage.seconds > maximum
              ? "Thời gian học đã vượt mốc Kết Trái"
              : undefined
          }
        >
          {duration(stage.seconds)} / {duration(maximum)} · {chapter.total} lượt
        </span>
        <strong>
          Cấp {stage.level} · {stage.name}
        </strong>
      </div>
      <p className="chapter-level-next">
        {stage.level === 5
          ? "Đã đạt Kết Trái."
          : `Còn ${duration(stage.remainingSeconds)} để lên ${STUDENT_LEVEL_NAMES[stage.level]}.`}
      </p>
    </div>
  );
}

export function StudentLevelCard({ classroom }: { classroom: Classroom }) {
  return (
    <section
      className="card student-level-card"
      aria-label="Cấp độ của bạn theo chương"
      data-classroom-id={classroom.id}
    >
      <span className="eyebrow">CẤP ĐỘ CỦA BẠN</span>
      <h2>
        {classroom.name} · {classroom.subject}
      </h2>
      <p>Cấp từng chương tính theo thời gian học được ghi nhận.</p>
      {classroom.chapters.map((chapter) => (
        <article className="chapter-level-card" key={chapter.id}>
          <ChapterTitle title={chapter.title} />
          <ChapterLevelTimeline chapter={chapter} />
        </article>
      ))}
      {!classroom.chapters.length && <p>Chưa có chương học.</p>}
    </section>
  );
}
