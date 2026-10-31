import { Avatar } from "./Avatars";
import { Motto } from "./components";
import { BookOpen, CheckCircle2, Notebook, Trophy } from "./icons";
import { StudentLevelIcon } from "./StudentLevel";
import {
  hasHonorsMetrics,
  rankClassHonors,
  type VisibleClassHonoree,
  type HonorsStudent,
} from "../shared/class-honors";
import type { ClassLeaderboard } from "./types";
import "./class-honors.css";

function HonorsMedal({ position }: { position: number }) {
  return (
    <svg
      className="honors-medal"
      viewBox="0 0 64 76"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M17 3h12l8 22-12 7L17 3Zm18 0h12l-8 29-12-7L35 3Z"
        fill="var(--podium-ink)"
      />
      <path
        d="m21 3 8 24m14-24-8 24"
        stroke="var(--podium-light)"
        strokeWidth="3"
      />
      <path
        d="m18 53-5 19 10-4 7 7 4-22m12 0 5 19-10-4-7 7-4-22"
        fill="var(--podium-color)"
        stroke="var(--podium-border)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="32"
        cy="39"
        r="24"
        fill="var(--podium-color)"
        stroke="var(--podium-border)"
        strokeWidth="2"
      />
      <circle
        cx="32"
        cy="39"
        r="19"
        fill="var(--podium-light)"
        stroke="var(--podium-border)"
        strokeWidth="1.5"
      />
      <path
        d="M16 34a17 17 0 0 1 22-11"
        fill="none"
        stroke="#fff"
        strokeOpacity=".8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x="32"
        y="47"
        textAnchor="middle"
        fontSize="24"
        fontWeight="800"
        fill="var(--podium-ink)"
      >
        {position}
      </text>
    </svg>
  );
}

function HonorStats({
  student,
  compact = false,
  showAccuracy = false,
}: {
  student: VisibleClassHonoree;
  compact?: boolean;
  showAccuracy?: boolean;
}) {
  return (
    <dl
      className={`honors-stats${compact ? " honors-stats-compact" : ""}${!showAccuracy ? " honors-stats-private" : ""}`}
    >
      <div>
        <dt title="Câu đã làm">
          <BookOpen size={15} />
          <span className={compact ? "sr-only" : undefined}>Câu đã làm</span>
        </dt>
        <dd>{student.answeredCount}</dd>
      </div>
      {showAccuracy && (
        <div>
          <dt title="Tỷ lệ đúng">
            <CheckCircle2 size={15} />
            <span className={compact ? "sr-only" : undefined}>Tỷ lệ đúng</span>
          </dt>
          <dd>
            {student.total
              ? `${((student.accuracy ?? 0) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`
              : "—"}
            {!compact && (student.total ?? 0) > 0 && (
              <span
                className="honors-accuracy-bar"
                role="progressbar"
                aria-label={`Tỷ lệ đúng · ${student.name}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={(student.accuracy ?? 0) * 100}
                aria-valuetext={`${student.correct}/${student.total} lượt đúng`}
              >
                <span style={{ width: `${(student.accuracy ?? 0) * 100}%` }} />
              </span>
            )}
          </dd>
        </div>
      )}
      <div>
        <dt title="Đã khắc phục">
          <Notebook size={15} />
          <span className={compact ? "sr-only" : undefined}>Đã khắc phục</span>
        </dt>
        <dd>{student.resolvedCount}</dd>
      </div>
    </dl>
  );
}

export function ClassHonors({
  students,
  leaderboard,
  loading,
  error,
  onRetry,
  viewerId,
  isTeacher = false,
}: {
  students: (HonorsStudent | VisibleClassHonoree)[];
  leaderboard?: ClassLeaderboard;
  loading: boolean;
  error: string;
  onRetry?: () => void;
  viewerId: string;
  isTeacher?: boolean;
}) {
  const preRanked =
    students.length > 0 &&
    students.every(
      (student) => "position" in student && Number.isInteger(student.position),
    );
  const complete = preRanked || hasHonorsMetrics(students as HonorsStudent[]);
  const ranked =
    leaderboard && complete
      ? preRanked
        ? (students as VisibleClassHonoree[])
        : rankClassHonors(
            students as HonorsStudent[],
            new Map(
              leaderboard.repairs.map((member) => [
                member.id,
                member.resolvedCorrections,
              ]),
            ),
          )
      : [];
  return (
    <section className="class-honors card" aria-labelledby="class-honors-title">
      <header className="class-honors-heading">
        <span className="class-honors-emblem">
          <Trophy size={27} />
        </span>
        <div>
          <span className="eyebrow">
            <Motto>CÙNG NHAU VƯƠN LÊN</Motto>
          </span>
          <h2 id="class-honors-title">Vinh danh Top 10</h2>
        </div>
      </header>
      <ol className="sr-only" aria-label="Thứ tự ưu tiên xếp hạng">
        <li>Cấp cây</li>
        <li>Câu đã làm</li>
        <li>Tỷ lệ đúng</li>
        <li>Câu khắc phục</li>
      </ol>
      {loading ? (
        <p role="status">Đang tải thành tích của lớp…</p>
      ) : error ? (
        <div className="error-banner" role="alert">
          {error}
          {onRetry && <button onClick={onRetry}>Thử lại Top 10</button>}
        </div>
      ) : !students.length ? (
        <p className="muted">Lớp chưa có học sinh để vinh danh.</p>
      ) : !leaderboard ? (
        <p role="status">Đang chờ thống kê khắc phục của lớp…</p>
      ) : !complete ? (
        <p role="status">Chưa đủ số liệu cấp cây và câu đã làm để xếp hạng.</p>
      ) : (
        <>
          <div className="honors-podium" aria-label="Ba hạng cao nhất">
            {[2, 1, 3].map((position) => {
              const student = ranked[position - 1];
              if (!student) return null;
              return (
                <article
                  className={`honors-podium-place honors-${["gold", "silver", "bronze"][position - 1]}`}
                  data-position={position}
                  key={student.id}
                  aria-label={`Hạng ${position} · ${student.name}`}
                >
                  <div className="honors-step">
                    <span className="sr-only">Hạng {position}</span>
                    <div className="honors-winner">
                      <div className="honors-avatar-medal">
                        {position === 1 && (
                          <svg
                            className="honors-crown"
                            viewBox="0 0 40 26"
                            aria-hidden="true"
                          >
                            <path
                              d="m4 7 8 6L20 3l8 10 8-6-3 16H7Z"
                              fill="#ffc944"
                              stroke="#97641c"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M9 19h22"
                              stroke="#fff4b2"
                              strokeWidth="2"
                            />
                            <circle cx="20" cy="15" r="2.5" fill="#e97753" />
                          </svg>
                        )}
                        <Avatar
                          name={student.name}
                          avatarId={student.avatarId}
                        />
                        <HonorsMedal position={position} />
                      </div>
                      <h3 title={student.name}>{student.name}</h3>
                      <div className="honors-tree">
                        <StudentLevelIcon level={student.treeLevel} />
                      </div>
                      <HonorStats
                        student={student}
                        compact
                        showAccuracy={isTeacher || student.id === viewerId}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {ranked.length > 3 && (
            <ol className="honors-list" start={4} aria-label="Hạng 4 đến 10">
              {ranked.slice(3).map((student) => (
                <li key={student.id} data-position={student.position}>
                  <span
                    className="honors-list-rank"
                    aria-label={`Hạng ${student.position}`}
                  >
                    {student.position}
                  </span>
                  <div className="honors-list-student">
                    <Avatar name={student.name} avatarId={student.avatarId} />
                    <strong>{student.name}</strong>
                  </div>
                  <div className="honors-tree">
                    <StudentLevelIcon level={student.treeLevel} />
                  </div>
                  <HonorStats
                    student={student}
                    showAccuracy={isTeacher || student.id === viewerId}
                  />
                </li>
              ))}
            </ol>
          )}
          <p className="honors-tie-note">
            Cấp cây cao nhất. Bằng bốn tiêu chí: xếp theo tên.
          </p>
        </>
      )}
    </section>
  );
}
