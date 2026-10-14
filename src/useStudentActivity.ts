import { useEffect, useState } from "react";
import { api, ApiError } from "./api";

type Activity = { id: string; seconds: number; activeForMs: number };

export function useStudentActivity(classroomId: string, retry: number) {
  const [snapshot, setSnapshot] = useState<{
    classroomId: string;
    receivedAt: number;
    members: Map<string, Activity>;
  }>();
  const [warning, setWarning] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    let alive = true,
      inFlight = false,
      unsupported = false;
    setSnapshot(undefined);
    setWarning("");
    async function refresh() {
      setCurrentTime(Date.now());
      if (!alive || inFlight || unsupported || document.hidden) return;
      if (!navigator.onLine) {
        setWarning("Mất kết nối. Chưa xác minh được phiên luyện tập.");
        return;
      }
      inFlight = true;
      // Subtract round-trip time so a delayed response cannot extend presence.
      const startedAt = Date.now();
      try {
        const members = await api<Activity[]>(
          `/classrooms/${classroomId}/student-activity`,
        );
        if (alive) {
          const receivedAt = Date.now();
          setSnapshot({
            classroomId,
            receivedAt,
            members: new Map(
              members.map((member) => [
                member.id,
                {
                  ...member,
                  activeForMs: Math.max(
                    0,
                    member.activeForMs - (receivedAt - startedAt),
                  ),
                },
              ]),
            ),
          });
          setCurrentTime(receivedAt);
          setWarning("");
        }
      } catch (error) {
        if (alive) {
          unsupported = error instanceof ApiError && error.status === 404;
          setWarning(
            unsupported
              ? "Cập nhật trực tiếp cần phiên bản máy chủ mới."
              : "Chưa cập nhật được phiên luyện tập. Đang kết nối lại…",
          );
        }
      } finally {
        inFlight = false;
      }
    }
    const offline = () =>
      setWarning("Mất kết nối. Chưa xác minh được phiên luyện tập.");
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [classroomId, retry]);
  return {
    snapshot: snapshot?.classroomId === classroomId ? snapshot : undefined,
    warning,
    isStudying(id: string) {
      const member =
        snapshot?.classroomId === classroomId
          ? snapshot.members.get(id)
          : undefined;
      return (
        !warning &&
        !!member &&
        member.activeForMs > 0 &&
        currentTime < snapshot!.receivedAt + member.activeForMs &&
        Date.now() < snapshot!.receivedAt + member.activeForMs
      );
    },
  };
}
