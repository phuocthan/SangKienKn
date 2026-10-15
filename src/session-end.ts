import { api } from "./api";
const key = "greenedu-study-closures";
export async function flushStudyClosures() {
  let pending: Record<string, string> = {};
  try {
    pending = JSON.parse(localStorage.getItem(key) ?? "{}");
  } catch {}
  for (const [id, violation] of Object.entries(pending)) {
    try {
      await api("/study/stop", { sessionId: id, active: false, violation });
      const latest = JSON.parse(localStorage.getItem(key) ?? "{}");
      delete latest[id];
      localStorage.setItem(key, JSON.stringify(latest));
    } catch {}
  }
}
export function closeInvalidStudy(id: string, violation: string) {
  let pending: Record<string, string> = {};
  try {
    pending = JSON.parse(localStorage.getItem(key) ?? "{}");
  } catch {}
  pending[id] = violation;
  localStorage.setItem(key, JSON.stringify(pending));
  void flushStudyClosures();
}
