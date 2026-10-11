import { useId } from "react";
import { STUDENT_LEVEL_NAMES, studentLevel } from "../shared/student-levels";
import type { Classroom } from "./types";
import { duration } from "./api";

export function StudentLevelIcon({
  level,
  className = "",
}: {
  level: number;
  className?: string;
}) {
  const stage = Math.max(1, Math.min(5, Math.floor(level)));
  const gradient = useId();
  return (
    <svg
      viewBox="0 0 80 80"
      className={`student-level-icon ${className}`}
      role="img"
      aria-label={`Cấp ${stage} · ${STUDENT_LEVEL_NAMES[stage - 1]}`}
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
  scope = "",
  compact = false,
}: {
  seconds: number;
  scope?: string;
  compact?: boolean;
}) {
  const stage = studentLevel(seconds);
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

export function StudentLevelCard({ classroom }: { classroom: Classroom }) {
  const stage =
    classroom.studentLevel ??
    studentLevel(classroom.chapters.reduce((n, ch) => n + ch.seconds, 0));
  return (
    <section
      className="card student-level-card"
      aria-label="Cấp độ của bạn trong lớp"
      data-classroom-id={classroom.id}
      data-level={stage.level}
    >
      <div className="student-level-overview">
        <StudentLevelIcon level={stage.level} />
        <div className="student-level-copy">
          <span className="eyebrow">CẤP ĐỘ CỦA BẠN</span>
          <h2>
            Cấp {stage.level} · {stage.name}
          </h2>
          <p>
            {classroom.name} · {classroom.subject}
          </p>
          <small>{duration(stage.seconds)} đã học trong lớp này</small>
        </div>
      </div>
      <div className="student-level-journey" aria-label="Năm cấp độ học tập">
        {STUDENT_LEVEL_NAMES.map((name, index) => (
          <div
            key={name}
            className={`student-level-step ${index + 1 === stage.level ? "current" : index + 1 < stage.level ? "earned" : ""}`}
            aria-current={index + 1 === stage.level ? "step" : undefined}
          >
            <StudentLevelIcon level={index + 1} />
            <span>{name}</span>
            <small>{index === 0 ? "Bắt đầu" : `${index} giờ`}</small>
          </div>
        ))}
      </div>
      <div className="student-level-next">
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Tiến độ cấp học sinh"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stage.progressPercent}
        >
          <span style={{ width: `${stage.progressPercent}%` }} />
        </div>
        <p>
          {stage.level === 5
            ? "Bạn đã đạt cấp Kết Trái trong lớp này. Tiếp tục chăm các cây kiến thức nhé!"
            : `Còn ${duration(stage.remainingSeconds)} để lên ${STUDENT_LEVEL_NAMES[stage.level]}.`}
        </p>
        <small>
          Mỗi lớp và môn học có cấp độ riêng, tính từ thời gian học được ghi
          nhận.
        </small>
      </div>
    </section>
  );
}
