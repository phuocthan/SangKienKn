import {
  STUDY_DAY_MS,
  studyDate,
  studyDayStart,
  studyPeriodStart,
} from "./study-statistics.js";

export function practiceWeek(now: number) {
  const week = studyPeriodStart(studyDate(now), "week");
  const startsAt = studyDayStart(week);
  return {
    week,
    startsAt,
    preliminaryAt: startsAt + 6.5 * STUDY_DAY_MS,
    closesAt: startsAt + 7 * STUDY_DAY_MS,
  };
}
export type WeeklyMember = {
  id: string;
  name: string;
  seconds: number;
  remainingSeconds: number;
};
export type WeeklyPracticeData = {
  serverNow: number;
  config: { minutes: number; effectiveWeek: string | null };
  weeks: { week: string; minutes: number; closed: boolean }[];
  report: null | {
    week: string;
    startsAt: number;
    closesAt: number;
    minutes: number;
    closed: boolean;
    coverageStart: number;
    preliminaryAt?: number;
    preliminary?: {
      completed: WeeklyMember[];
      incomplete: WeeklyMember[];
    } | null;
    completed: WeeklyMember[];
    incomplete: WeeklyMember[];
  };
};
