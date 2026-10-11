import { useState, type CSSProperties } from "react";
import { Flower2, Leaf, Pause, Play, Sprout, Trophy } from "lucide-react";
import { STUDENT_LEVEL_NAMES } from "../shared/student-levels";
import { Avatar } from "./Avatars";
import { StudentLevelIcon } from "./StudentLevel";
import type { ClassGardenMember, ClassTree } from "./types";
import "./student-garden.css";

const shortName = (name: string) =>
  name.trim().split(/\s+/).slice(-2).join(" ");
const byLevel = (a: ClassGardenMember, b: ClassGardenMember) =>
  b.level - a.level ||
  a.studentName.localeCompare(b.studentName, "vi") ||
  a.studentId.localeCompare(b.studentId);

export function StudentGarden({
  members,
  trees,
  userId,
  subject,
  classroomName,
  teacherName,
  teacherAvatarId,
}: {
  members?: ClassGardenMember[];
  trees: ClassTree[];
  userId: string;
  subject: string;
  classroomName: string;
  teacherName: string;
  teacherAvatarId?: string | null;
}) {
  const [animated, setAnimated] = useState(true);
  const students = [...(members ?? [])].sort(byLevel);
  // Older APIs prove only level-5 achievement. Don't infer roster or levels from
  // aggregate time; one honoree per student even if several chapters earned trees.
  const celebrated = members
    ? students.filter((student) => student.level === 5)
    : [
        ...new Map(
          trees.map((tree) => [
            tree.studentId,
            {
              studentId: tree.studentId,
              studentName: tree.studentName,
              level: 5,
              avatarId: null,
            },
          ]),
        ).values(),
      ].sort(byLevel);
  return (
    <>
      <section
        className="garden-honors card"
        aria-labelledby="garden-honors-title"
      >
        <header className="garden-honors-heading">
          <span className="garden-trophy">
            <Trophy size={25} />
          </span>
          <div>
            <span className="eyebrow">NHỮNG CÂY ĐÃ KẾT TRÁI</span>
            <h2 id="garden-honors-title">Vinh danh Kết Trái · Cấp 5</h2>
            <p>
              Ghi nhận những bạn đã đạt cấp cao nhất trong một chương của lớp.
            </p>
          </div>
          <span className="garden-honors-count">{celebrated.length} bạn</span>
        </header>
        {celebrated.length ? (
          <div className="garden-honors-members">
            {celebrated.map((student) => (
              <article
                className={`garden-honoree ${student.studentId === userId ? "is-mine" : ""}`}
                key={student.studentId}
                title={student.studentName}
                aria-label={`${student.studentName} · Cấp 5 · Kết Trái`}
                data-student-id={student.studentId}
              >
                <StudentLevelIcon level={5} />
                <Avatar
                  name={student.studentName}
                  avatarId={student.avatarId}
                />
                <div>
                  <strong>{shortName(student.studentName)}</strong>
                  <small>
                    Cấp 5 · Kết Trái
                    {student.studentId === userId ? " · Bạn" : ""}
                  </small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="garden-honors-empty">
            Chưa có bạn đạt cấp 5. Cùng chăm vườn để cây kết trái nhé!
          </p>
        )}
      </section>
      <section
        className={`student-garden card ${animated ? "is-animated" : ""}`}
        aria-labelledby="student-garden-title"
      >
        <header className="student-garden-heading">
          <div>
            <span className="eyebrow">
              <Sprout size={15} /> KHU VƯỜN CHUNG
            </span>
            <h2 id="student-garden-title">Khu vườn {classroomName}</h2>
            <p>
              {members ? `${members.length} học sinh · ` : ""}
              {subject}
            </p>
          </div>
          <button
            className="button outline small"
            disabled={!students.length}
            onClick={() => setAnimated((value) => !value)}
            aria-pressed={animated}
          >
            {animated ? <Pause size={15} /> : <Play size={15} />}
            {animated ? "Tắt chuyển động" : "Bật chuyển động"}
          </button>
        </header>
        <p className="student-garden-explanation">
          Mỗi bạn một cây với cấp cao nhất đã đạt trong các chương của lớp. Tất
          cả cùng dạo quanh khu vườn, kể cả những bạn đã Kết Trái.
        </p>
        <div className="garden-enclosure">
          <div
            className="garden-world"
            tabIndex={0}
            role="region"
            aria-label="Khu vườn có hàng rào, cuộn để xem toàn bộ học sinh"
          >
            <div className="garden-floor">
              <div className="garden-scenery" aria-hidden="true">
                <div className="garden-path" />
                <div className="garden-flowerbed garden-flowerbed-one">
                  <Flower2 />
                  <Leaf />
                  <Flower2 />
                </div>
                <div className="garden-flowerbed garden-flowerbed-two">
                  <Flower2 />
                  <Sprout />
                  <Flower2 />
                </div>
              </div>
              {students.length ? (
                <div className="garden-students">
                  {students.map((student, index) => (
                    <div
                      className="garden-wander-space"
                      key={student.studentId}
                    >
                      <article
                        className={`garden-student ${student.studentId === userId ? "is-mine" : ""}`}
                        title={student.studentName}
                        aria-label={`${student.studentName} · Cấp ${student.level} · ${STUDENT_LEVEL_NAMES[student.level - 1]}${student.studentId === userId ? " · Bạn" : ""}`}
                        data-student-id={student.studentId}
                        data-level={student.level}
                        style={
                          {
                            "--wander-delay": `${(index % 11) * -2.3}s`,
                            "--wander-duration": `${16 + (index % 5) * 3}s`,
                            "--wander-direction":
                              index % 2 ? "reverse" : "normal",
                            "--plant-delay": `${(index % 7) * -0.6}s`,
                            "--start-y": `${((index % 3) - 1) * 4}px`,
                          } as CSSProperties
                        }
                      >
                        <div className="garden-plant">
                          <StudentLevelIcon level={student.level} />
                          <Avatar
                            name={student.studentName}
                            avatarId={student.avatarId}
                            className="garden-student-avatar"
                          />
                        </div>
                        <strong className="garden-student-name">
                          {shortName(student.studentName)}
                          {student.studentId === userId && (
                            <span className="garden-you">Bạn</span>
                          )}
                        </strong>
                        <small>
                          Cấp {student.level} ·{" "}
                          {STUDENT_LEVEL_NAMES[student.level - 1]}
                        </small>
                      </article>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="garden-awaiting" role="status">
                  <Sprout size={38} />
                  <h3>
                    {members
                      ? "Khu vườn đang chờ thành viên"
                      : "Khu vườn đang chờ cập nhật"}
                  </h3>
                  <p>
                    {members
                      ? "Học sinh tham gia lớp sẽ có một cây riêng tại đây."
                      : "Danh sách học sinh, avatar và cấp cao nhất đang chờ cập nhật server."}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="garden-fence garden-fence-top" aria-hidden="true" />
          <div
            className="garden-fence garden-fence-bottom"
            aria-hidden="true"
          />
          <div className="garden-fence garden-fence-left" aria-hidden="true" />
          <div className="garden-fence garden-fence-right" aria-hidden="true" />
          <div className="garden-entrance">
            <span
              className="garden-teacher-portrait"
              role="img"
              aria-label="Avatar giáo viên"
            >
              <Avatar
                name={teacherName}
                avatarId={teacherAvatarId}
                className="garden-teacher-avatar"
              />
            </span>
            <div
              className="garden-gate garden-class-sign"
              role="group"
              aria-label="Lớp học"
            >
              <div className="garden-class-identity">
                <strong>{classroomName}</strong>
                <span>{subject}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
