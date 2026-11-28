import { WorkspaceHeading } from "./WorkspaceHeading";
import { useEffect, useState } from "react";
import { Clock3, Users } from "./icons";
import { api, duration, errorMessage } from "./api";
import { BloomingTreeIcon } from "./StudentLevel";
import { ClassHonors } from "./ClassHonors";
import { Motto } from "./components";
import type {
  HonorsStudent,
  VisibleClassHonoree,
} from "../shared/class-honors";
import { StudentGarden } from "./StudentGarden";
import { ChapterChips } from "./ChapterChips";
import type {
  ClassLeaderboard,
  Classroom,
  ClassTree,
  ClassGardenMember,
} from "./types";

type ChapterHonors = {
  chapters: { id: string; title: string }[];
  chapterId: string | null;
  honorees: VisibleClassHonoree[];
};

const studyTime = (seconds: number) =>
  seconds < 60 ? `${seconds} giây` : duration(seconds);

export function ClassCommunity({
  classroom,
  revision,
  userId,
  teacherAvatarId,
  isTeacher = false,
  embedded = false,
}: {
  classroom: Classroom;
  revision: number;
  userId: string;
  teacherAvatarId?: string | null;
  isTeacher?: boolean;
  embedded?: boolean;
}) {
  const [data, setData] = useState<{
    trees: ClassTree[];
    members?: ClassGardenMember[];
    teacher?: { name: string; avatarId: string | null };
    board: ClassLeaderboard;
    honorStudents: (HonorsStudent | VisibleClassHonoree)[];
    honorsError: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  // Chapter filter for the rankings; "" keeps the whole-class view.
  const [chapters, setChapters] = useState<{ id: string; title: string }[]>([]);
  const [chapterId, setChapterId] = useState("");
  const [chapterHonors, setChapterHonors] = useState<{
    chapterId: string;
    honorees: VisibleClassHonoree[];
  } | null>(null);
  const [chapterError, setChapterError] = useState("");
  useEffect(() => {
    let alive = true;
    api<ChapterHonors>(`/classrooms/${classroom.id}/chapter-honors`)
      .then((result) => {
        // Older backends have no chapter rankings: keep the class view only.
        if (alive && Array.isArray(result?.chapters))
          setChapters(result.chapters);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [classroom.id, revision]);
  useEffect(() => {
    if (!chapterId) return;
    let alive = true;
    setChapterError("");
    const load = () =>
      api<ChapterHonors>(
        `/classrooms/${classroom.id}/chapter-honors?chapter=${encodeURIComponent(chapterId)}`,
      )
        .then((result) => {
          if (!alive) return;
          if (!Array.isArray(result?.honorees))
            throw new Error("Chưa tải được xếp hạng theo chương.");
          setChapterError("");
          setChapterHonors({ chapterId, honorees: result.honorees });
        })
        .catch((e) => {
          if (alive) setChapterError(errorMessage(e));
        });
    void load();
    const update = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void load();
    };
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, [classroom.id, chapterId, revision, retry]);
  const chapter = chapters.find((item) => item.id === chapterId);
  const chapterReady = chapterHonors?.chapterId === chapterId;
  // In a chapter view each garden tree shows that chapter's level, not the best one.
  const chapterLevels =
    chapter && chapterReady
      ? new Map(chapterHonors!.honorees.map((row) => [row.id, row.treeLevel]))
      : null;
  useEffect(() => {
    let alive = true;
    let inFlight = false;
    setLoading(true);
    setError("");
    const refresh = () => {
      if (!alive || inFlight) return;
      inFlight = true;
      Promise.allSettled([
        api<{
          trees: ClassTree[];
          members?: ClassGardenMember[];
          teacher?: { name: string; avatarId: string | null };
        }>(`/classrooms/${classroom.id}/garden`),
        api<ClassLeaderboard>(`/classrooms/${classroom.id}/leaderboard`),
        api<(HonorsStudent | VisibleClassHonoree)[]>(
          `/classrooms/${classroom.id}/honors`,
        ),
      ])
        .then(([gardenResult, boardResult, honorsResult]) => {
          if (gardenResult.status === "rejected") throw gardenResult.reason;
          if (boardResult.status === "rejected") throw boardResult.reason;
          const garden = gardenResult.value,
            board = boardResult.value;
          if (alive) {
            setError("");
            setData({
              trees: garden.trees,
              members: garden.members,
              teacher: garden.teacher,
              board,
              honorStudents:
                honorsResult.status === "fulfilled" &&
                Array.isArray(honorsResult.value)
                  ? honorsResult.value
                  : [],
              honorsError:
                honorsResult.status === "rejected"
                  ? honorsResult.reason instanceof SyntaxError
                    ? "Bảng vinh danh đang chờ cập nhật hệ thống."
                    : errorMessage(honorsResult.reason)
                  : !Array.isArray(honorsResult.value)
                    ? "Chưa tải được thành tích của lớp."
                    : "",
            });
          }
        })
        .catch((e) => {
          if (alive) setError(errorMessage(e));
        })
        .finally(() => {
          inFlight = false;
          if (alive) setLoading(false);
        });
    };
    const update = () => {
      if (document.visibilityState === "visible" && navigator.onLine) refresh();
    };
    refresh();
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [classroom.id, revision, retry]);

  return (
    <>
      {!embedded && (
        <WorkspaceHeading className="page-heading">
          <div>
            <h1>Khu vườn của lớp</h1>
          </div>
        </WorkspaceHeading>
      )}
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
                <BloomingTreeIcon />
              </span>
              <span className="stat-label">Cây đã ra hoa</span>
              <strong>{data.board.bloomedTrees}</strong>
              <small>Một cây cho mỗi học sinh/chương</small>
            </div>
            <div className="stat-card card">
              <span className="stat-icon">
                <Users size={21} />
              </span>
              <span className="stat-label">Thành viên có hoạt động</span>
              <strong>
                {data.board.activeStudents}/{data.board.participantCount}
              </strong>
              <small>Đã học hoặc sửa sai trong lớp</small>
            </div>
            <div className="stat-card card">
              <span className="stat-icon blue">
                <Clock3 size={21} />
              </span>
              <span className="stat-label">Thời gian học của lớp</span>
              <strong>{studyTime(data.board.totalSeconds)}</strong>
              <small>Thời gian học có hoạt động được ghi nhận</small>
            </div>
          </div>
          {chapters.length > 0 && (
            <div className="ranking-scope card">
              <label>
                <strong>Phạm vi xếp hạng</strong>
                <small>
                  Áp dụng cho Vinh danh Top 10, Vinh danh Kết Trái và Khu vườn
                  chung.
                </small>
              </label>
              <ChapterChips
                id="ranking-scope-select"
                label="Phạm vi xếp hạng"
                allLabel="Cả lớp"
                chapters={chapters}
                value={chapter ? chapterId : ""}
                onChange={setChapterId}
              />
            </div>
          )}
          <ClassHonors
            students={
              chapter ? (chapterHonors?.honorees ?? []) : data.honorStudents
            }
            leaderboard={data.board}
            loading={!!chapter && !chapterReady && !chapterError}
            error={chapter ? chapterError : data.honorsError}
            onRetry={() => setRetry((n) => n + 1)}
            viewerId={userId}
            isTeacher={isTeacher}
            scopeLabel={chapter?.title}
          />
          <StudentGarden
            chapter={chapter}
            members={
              chapterLevels && data.members
                ? data.members.map((member) => ({
                    ...member,
                    level: chapterLevels.get(member.studentId) ?? 1,
                  }))
                : data.members
            }
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
        </>
      )}
    </>
  );
}
