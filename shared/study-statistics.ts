export type StudyPeriod = "day" | "week" | "month";
export type StudyBucket = {
  start: string;
  end: string;
  seconds: number | null;
  coverage: "none" | "partial" | "full";
};
export type StudyStatistics = {
  report?: StudyRangeReport;
  period: StudyPeriod;
  date: string;
  trackingStartedAt: number;
  lifetimeSeconds: number;
  summaries: { day: StudyBucket; week: StudyBucket; month: StudyBucket };
  buckets: StudyBucket[];
};

export type StudyRangeMember = {
  id: string;
  name: string;
  seconds: number | null;
  attempts: number;
  correct: number;
  huntPoints: number;
  pendingHuntPoints: number;
  onlineExams: {
    id: string;
    title: string;
    score: number;
    submittedAt: number;
  }[];
};
export type StudyRangeReport = {
  from: string;
  to: string;
  coverage: "none" | "partial" | "full";
  members: StudyRangeMember[];
};

export type ClassroomStudyStatistics = StudyStatistics & {
  members: { id: string; name: string; statistics: StudyStatistics }[];
};

export const STUDY_DAY_MS = 86400000;
export const VIETNAM_OFFSET_MS = 7 * 3600000;
export const studyDate = (timestamp: number) =>
  new Date(timestamp + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);
export const studyDayStart = (date: string) =>
  Date.parse(`${date}T00:00:00+07:00`);

export function validStudyDate(date: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(studyDayStart(date)) &&
    studyDate(studyDayStart(date)) === date &&
    date >= "2000-01-01" &&
    date <= "9998-12-31"
  );
}

export function studyPeriodStart(date: string, period: StudyPeriod) {
  const timestamp = studyDayStart(date);
  if (period === "day") return date;
  if (period === "month") return `${date.slice(0, 7)}-01`;
  const weekday = new Date(timestamp + VIETNAM_OFFSET_MS).getUTCDay();
  return studyDate(timestamp - ((weekday + 6) % 7) * STUDY_DAY_MS);
}

export function shiftStudyPeriod(
  start: string,
  period: StudyPeriod,
  steps: number,
) {
  if (period !== "month")
    return studyDate(
      studyDayStart(start) + steps * (period === "week" ? 7 : 1) * STUDY_DAY_MS,
    );
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + steps);
  return date.toISOString().slice(0, 10);
}
