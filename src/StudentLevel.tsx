import { useId } from "react";
import { Check, LockKeyhole } from "./icons";
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
      <path
        d="M21 68h38"
        stroke="currentColor"
        opacity=".25"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {stage === 1 && (
        <>
          <ellipse
            cx="39"
            cy="49"
            rx="12"
            ry="16"
            transform="rotate(30 39 49)"
            fill="#b68b57"
            fillOpacity=".25"
            stroke="#916d40"
            strokeWidth="3.4"
          />
          <path
            d="M40 35q-2-15 13-19-1 14-13 19m-2 17 5-11"
            fill="currentColor"
            fillOpacity=".25"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </>
      )}
      {stage === 2 && (
        <>
          <path
            d="M40 66V39"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d="M40 47C24 47 19 35 20 27c14-1 23 7 20 20Zm0-8c-2-14 7-23 22-22 2 14-7 24-22 22Z"
            fill="currentColor"
            fillOpacity=".22"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
        </>
      )}
      {stage >= 3 && (
        <>
          <path
            d="M40 66V41m0 13-10-10m10 5 10-11"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 47C11 46 10 32 20 28C18 17 29 11 37 17C43 6 58 11 58 23C71 22 75 37 64 43C66 54 53 59 45 51C38 60 24 57 22 47Z"
            fill="currentColor"
            fillOpacity=".19"
            stroke="currentColor"
            strokeWidth="3.4"
          />
        </>
      )}
      {stage === 4 &&
        [
          [27, 32],
          [48, 24],
          [55, 42],
        ].map(([x, y]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path
              d="M0-5C8-10 11 1 5 4C3 12-9 8-6 2C-12-4-3-11 0-5Z"
              fill="#f3d5bb"
              stroke="#a5673e"
              strokeWidth="2"
            />
            <circle r="2" fill="#a5673e" />
          </g>
        ))}
      {stage === 5 &&
        [
          [26, 32],
          [49, 23],
          [54, 43],
        ].map(([x, y]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path
              d="M0-6v-4m0 1 5-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            <circle r="5.3" fill="#e6b455" stroke="#9a7130" strokeWidth="2" />
          </g>
        ))}
    </svg>
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
        <span>
          {duration(stage.seconds)} / {duration(maximum)} · {chapter.total} lượt
          luyện tập
        </span>
        <strong>
          Cấp {stage.level} · {stage.name}
        </strong>
      </div>
      <p className="chapter-level-next">
        {stage.level === 5
          ? "Đã đạt Kết Trái trong chương này."
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
      <p>
        Mỗi chương có cấp riêng, tính từ thời gian học được ghi nhận trong
        chương đó.
      </p>
      {classroom.chapters.map((chapter) => (
        <article className="chapter-level-card" key={chapter.id}>
          <h3>{chapter.title}</h3>
          <ChapterLevelTimeline chapter={chapter} />
        </article>
      ))}
      {!classroom.chapters.length && <p>Chưa có chương học.</p>}
    </section>
  );
}
