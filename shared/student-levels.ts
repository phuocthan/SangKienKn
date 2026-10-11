export const STUDENT_LEVEL_NAMES = [
  "Mầm",
  "Chồi",
  "Cây Non",
  "Đơm Hoa",
  "Kết Trái",
] as const;

export type StudentLevel = {
  level: number;
  name: string;
  seconds: number;
  progressPercent: number;
  remainingSeconds: number;
};

export function studentLevel(seconds: number): StudentLevel {
  const recorded = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 0;
  const level = Math.min(5, Math.floor(recorded / 3600) + 1);
  return {
    level,
    name: STUDENT_LEVEL_NAMES[level - 1],
    seconds: recorded,
    progressPercent: level === 5 ? 100 : Math.floor((recorded % 3600) / 36),
    remainingSeconds: level === 5 ? 0 : level * 3600 - recorded,
  };
}
