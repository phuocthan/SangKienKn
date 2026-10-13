import { WorkspaceHeading } from "./WorkspaceHeading";
import { useEffect, useState } from "react";
import { Clock3, Flower2, RefreshCw, Users } from "./icons";
import { api, duration, errorMessage } from "./api";
import { Empty, SectionTitle } from "./components";
import { ChapterLevelIcons } from "./StudentLevel";
import { StudentGarden } from "./StudentGarden";
import type {
  ClassLeaderboard,
  Classroom,
  ClassTree,
  CommunityMember,
  ClassGardenMember,
} from "./types";

const studyTime = (seconds: number) =>
  seconds < 60 ? `${seconds} giây` : duration(seconds);

export function ClassCommunity({
  classroom,
  revision,
  userId,
  teacherAvatarId,
}: {
  classroom: Classroom;
  revision: number;
  userId: string;
  teacherAvatarId?: string | null;
}) {
  const [data, setData] = useState<{
    trees: ClassTree[];
    members?: ClassGardenMember[];
    teacher?: { name: string; avatarId: string | null };
    board: ClassLeaderboard;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    Promise.all([
      api<{
        trees: ClassTree[];
        members?: ClassGardenMember[];
        teacher?: { name: string; avatarId: string | null };
      }>(`/classrooms/${classroom.id}/garden`),
      api<ClassLeaderboard>(`/classrooms/${classroom.id}/leaderboard`),
    ])
      .then(([garden, board]) => {
        if (alive)
          setData({
            trees: garden.trees,
            members: garden.members,
            teacher: garden.teacher,
            board,
          });
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [classroom.id, revision, retry]);

  return (
    <>
      <WorkspaceHeading className="page-heading">
        <div>
          <h1>Khu vườn của lớp</h1>
          <span className="eyebrow">CÙNG NHAU LỚN LÊN · {classroom.name}</span>
          <p>Mỗi bạn một cây, cùng nhau chăm khu vườn của lớp.</p>
        </div>
        <button
          className="button outline small"
          disabled={loading}
          onClick={() => setRetry((n) => n + 1)}
        >
          <RefreshCw size={16} />
          Cập nhật
        </button>
      </WorkspaceHeading>
      {error ? (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setRetry((n) => n + 1)}>Thử lại</button>
        </div>
      ) : loading || !data ? (
        <div className="loading-panel" role="status">
          Đang tải hoạt động của lớp…
        </div>
      ) : (
        <>
          <div className="stats-grid community-stats">
            <div className="stat-card card">
              <span className="stat-icon rose">
                <Flower2 size={21} />
              </span>
              <span className="stat-label">Cây đã ra hoa</span>
              <strong>{data.board.bloomedTrees}</strong>
              <small>Mỗi cây ứng với một học sinh và một chương</small>
            </div>
            <div className="stat-card card">
              <span className="stat-icon">
                <Users size={21} />
              </span>
              <span className="stat-label">Thành viên có hoạt động</span>
              <strong>
                {data.board.activeStudents}/{data.board.participantCount}
              </strong>
              <small>Đã học hoặc khắc phục lỗi sai trong lớp này</small>
            </div>
            <div className="stat-card card">
              <span className="stat-icon blue">
                <Clock3 size={21} />
              </span>
              <span className="stat-label">Thời gian học của lớp</span>
              <strong>{studyTime(data.board.totalSeconds)}</strong>
              <small>Tổng thời gian có hoạt động đã được ghi nhận</small>
            </div>
          </div>
          <StudentGarden
            members={data.members}
            trees={data.trees}
            userId={userId}
            subject={classroom.subject}
            classroomName={classroom.name}
            teacherName={data.teacher?.name ?? classroom.teacherName}
            teacherAvatarId={
              teacherAvatarId !== undefined
                ? teacherAvatarId
                : data.teacher?.avatarId
            }
          />
          <>
            <SectionTitle
              title="Những người chăm vườn"
              description="Ưu tiên thời gian học; cùng thời gian thì xét số cây ra hoa. Thành tích bằng nhau cùng hạng."
            />
            <Ranking rows={data.board.effort} userId={userId} kind="effort" />
            <SectionTitle
              title="Bác sĩ cây trồng"
              description="Ghi nhận số câu đang ở trạng thái đã khắc phục trong lớp. Một câu chỉ tính một lần."
            />
            <Ranking rows={data.board.repairs} userId={userId} kind="repairs" />
            <p className="subtle-note">
              Chỉ hiển thị thành viên đã có hoạt động tương ứng. Thành tích tính
              trong lớp đang chọn và không dùng điểm số để xếp hạng.
            </p>
          </>
        </>
      )}
    </>
  );
}

function Ranking({
  rows,
  userId,
  kind,
}: {
  rows: CommunityMember[];
  userId: string;
  kind: "effort" | "repairs";
}) {
  if (!rows.length)
    return (
      <Empty
        title={
          kind === "effort"
            ? "Chưa có thành tích chăm vườn"
            : "Chưa có câu được khắc phục"
        }
        text={
          kind === "effort"
            ? "Thời gian học có hoạt động sẽ được ghi nhận tại đây."
            : "Làm lại đúng các câu trong sổ tay sửa sai để ghi nhận nỗ lực của bạn."
        }
      />
    );
  return (
    <div className={`card community-ranking table-scroll ${kind}`}>
      <table
        aria-label={
          kind === "effort" ? "Xếp hạng chăm vườn" : "Xếp hạng sửa sai"
        }
      >
        <thead>
          <tr>
            <th scope="col">Hạng</th>
            <th scope="col">Học sinh</th>
            <th scope="col">
              {kind === "effort" ? "Thời gian học" : "Câu đã khắc phục"}
            </th>
            <th scope="col">Cây ra hoa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((member) => (
            <tr
              key={member.id}
              className={member.id === userId ? "community-mine" : ""}
            >
              <td>
                <span
                  className={`community-rank ${member.rank <= 3 ? "community-top" : ""}`}
                >
                  {member.rank}
                </span>
              </td>
              <th scope="row">
                <span className="community-student-line">
                  <span className="community-you-slot">
                    {member.id === userId && (
                      <span className="pill community-you">Bạn</span>
                    )}
                  </span>
                  <span className="community-student-name">{member.name}</span>
                  <ChapterLevelIcons chapters={member.chapterLevels} />
                </span>
              </th>
              <td>
                {kind === "effort"
                  ? studyTime(member.seconds)
                  : member.resolvedCorrections}
              </td>
              <td>{member.bloomedTrees}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
