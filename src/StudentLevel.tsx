import { useId } from "react";
import { Check, LockKeyhole } from "lucide-react";
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
  const gradient = useId();
  return (
    <svg
      viewBox="0 0 80 80"
      className={`student-level-icon ${className}`}
      role="img"
      aria-label={label ?? `Cấp ${stage} · ${STUDENT_LEVEL_NAMES[stage - 1]}`}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={stage === 5 ? "#377f52" : "#a2d878"} />
          <stop offset="1" stopColor={stage === 5 ? "#164b35" : "#38865a"} />
        </linearGradient>
      </defs>
      <circle
        cx="40"
        cy="40"
        r="37"
        fill={stage === 5 ? "#f3f0dc" : "#eef6e9"}
      />
      <ellipse cx="40" cy="65" rx="23" ry="5" fill="#d4e4c7" />
      {stage === 1 && (
        <>
          <path
            d="M41 52q-2 9-9 12m9-12q6 8 10 10"
            stroke="#aa7a47"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M28 48c-1-14 9-22 21-18 13 4 10 24-1 28-8 3-17-2-20-10Z"
            fill="#bd8a53"
            stroke="#966439"
            strokeWidth="2"
          />
          <path
            d="M35 40q4-6 11-5"
            stroke="#e7c799"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M44 30q-1-9 8-12-1 10-8 12Z" fill={`url(#${gradient})`} />
        </>
      )}
      {stage === 2 && (
        <>
          <path
            d="M40 64V39q0-8 6-14"
            stroke="#397c4b"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M40 45C26 45 18 35 20 26c14-1 23 8 20 19Z"
            fill={`url(#${gradient})`}
            stroke="#4d9256"
            strokeWidth="1.5"
          />
          <path
            d="M40 39c-2-13 7-21 21-19 1 12-8 20-21 19Z"
            fill="#67af65"
            stroke="#4d9256"
            strokeWidth="1.5"
          />
          <path
            d="m27 33 13 12m0-6 13-12"
            stroke="#c5e6aa"
            strokeWidth="1.5"
            fill="none"
          />
        </>
      )}
      {stage === 3 && (
        <>
          <path
            d="M40 64V35m0 12L29 37m11 8 11-12"
            stroke="#ad7d4c"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="29" cy="33" r="12" fill="#7fbd6d" />
          <circle cx="50" cy="33" r="12" fill="#539e60" />
          <circle cx="40" cy="23" r="14" fill={`url(#${gradient})`} />
          <path
            d="M34 20q3-4 8-3"
            stroke="#cae7ac"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {stage >= 4 && (
        <>
          <path
            d={stage === 5 ? "M34 67l3-28h7l3 28-7-3Z" : "M37 65l1-25h5l1 25Z"}
            fill="#ad7d4c"
            stroke="#865d37"
            strokeWidth="1.5"
          />
          <path
            d="M40 50 29 38m11 9 12-12"
            stroke="#865d37"
            strokeWidth={stage === 5 ? 4 : 3}
            fill="none"
            strokeLinecap="round"
          />
          {stage === 5 ? (
            <>
              <path
                d="M13 38c-7-9 1-22 12-21C27 3 48 4 52 16c14-1 22 10 15 20 5 13-10 20-20 14-6 8-18 8-23 0-10 3-17-4-11-12Z"
                fill={`url(#${gradient})`}
                stroke="#29663f"
                strokeWidth="2"
              />
              <path
                d="M23 26q5-5 11-4m12-4q6-1 10 4M21 40q3 5 9 4"
                stroke="#86b76b"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M37 62l-7 5m14-5 9 5"
                stroke="#865d37"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {[
                [24, 32],
                [46, 24],
                [54, 43],
              ].map(([x, y]) => (
                <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                  <path
                    d="M0-3v-5"
                    stroke="#865d37"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path d="M0-6q2-5 6-3-1 4-6 3Z" fill="#a8d67a" />
                  <circle
                    r="5.5"
                    fill="#efaa3f"
                    stroke="#cd7f2d"
                    strokeWidth="1"
                  />
                  <path
                    d="M-3-1q1-2 3-2"
                    stroke="#ffe4a0"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              ))}
            </>
          ) : (
            <>
              <circle cx="29" cy="33" r="14" fill="#7fbd6d" />
              <circle cx="51" cy="33" r="14" fill="#539e60" />
              <circle cx="40" cy="23" r="17" fill={`url(#${gradient})`} />
              <path
                d="M32 20q4-5 10-4"
                stroke="#cae7ac"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              {[
                [25, 34],
                [41, 21],
                [54, 37],
              ].map(([x, y]) => (
                <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                  {[
                    [0, -4],
                    [4, -1],
                    [2.5, 3.5],
                    [-2.5, 3.5],
                    [-4, -1],
                  ].map(([px, py], index) => (
                    <circle key={index} cx={px} cy={py} r="3" fill="#f3b8bb" />
                  ))}
                  <circle r="2.5" fill="#f7d16b" />
                </g>
              ))}
            </>
          )}
        </>
      )}
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
