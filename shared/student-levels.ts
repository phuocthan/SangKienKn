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

export const DEFAULT_LEVEL_MINUTES = 60;

export function levelStepSeconds(minutes = DEFAULT_LEVEL_MINUTES): number {
  return (
    (Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440
      ? minutes
      : DEFAULT_LEVEL_MINUTES) * 60
  );
}

export function studentLevel(
  seconds: number,
  minutes = DEFAULT_LEVEL_MINUTES,
): StudentLevel {
  const recorded = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 0;
  const step = levelStepSeconds(minutes);
  const level = Math.min(5, Math.floor(recorded / step) + 1);
  return {
    level,
    name: STUDENT_LEVEL_NAMES[level - 1],
    seconds: recorded,
    progressPercent:
      level === 5 ? 100 : Math.floor(((recorded % step) / step) * 100),
    remainingSeconds: level === 5 ? 0 : level * step - recorded,
  };
}
