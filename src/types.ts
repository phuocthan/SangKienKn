import type { QuestionKind } from "../shared/question-types";
import type { StudentLevel } from "../shared/student-levels";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  mustChange: boolean;
  avatarId?: string | null;
  uploadedAvatarId?: string | null;
};
export type Chapter = {
  levelMinutes?: number;
  id: string;
  title: string;
  questionCount: number;
  lessons: { title: string; questionCount: number }[];
  canManageLessons?: boolean;
  canDeleteChapter?: boolean;
  canReorderChapter?: boolean;
  canDeleteQuestions?: boolean;
  canTagQuestions?: boolean;
  seconds: number;
  level: number;
  total: number;
  correct: number;
  openCorrections: number;
};
export type Classroom = {
  levelMinutes?: number;
  studentLevel?: StudentLevel | null;
  id: string;
  name: string;
  subject: string;
  grade: string;
  teacherName: string;
  studentCount: number;
  chapters: Chapter[];
};
export type Question = {
  kind?: QuestionKind;
  correctAnswer?: string;
  topic?: string;
  id: string;
  chapterId: string;
  lesson?: string;
  text: string;
  choices: string[];
  correction: boolean;
  correctIndex?: number;
  explanation?: string;
  active?: boolean;
  isCurrent?: boolean;
  version?: number;
  changedAt?: number | null;
};
export type Result = {
  statementCorrectness?: boolean[];
  correctAnswer?: string;
  correct: boolean;
  correctIndex?: number;
  explanation: string;
  resolved: boolean;
};
export type Student = {
  answeredQuestions?: number;
  chapterLevels?: (StudentLevel & {
    levelMinutes?: number;
    chapterId: string;
    chapterTitle: string;
  })[];
  studentLevel?: StudentLevel;
  avatarId?: string | null;
  id: string;
  name: string;
  email: string;
  seconds: number;
  total: number;
  correct: number;
  openCorrections: number;
  trees: number;
};

export type ClassTree = {
  studentId: string;
  studentName: string;
  chapterId: string;
  chapterTitle: string;
};
export type ClassGardenMember = {
  studentId: string;
  studentName: string;
  avatarId: string | null;
  level: number;
};
export type CommunityMember = {
  chapterLevels?: (StudentLevel & {
    levelMinutes?: number;
    chapterId: string;
    chapterTitle: string;
  })[];
  studentLevel?: StudentLevel;
  id: string;
  name: string;
  seconds: number;
  bloomedTrees: number;
  resolvedCorrections: number;
  rank: number;
};
export type ClassLeaderboard = {
  participantCount: number;
  activeStudents: number;
  totalSeconds: number;
  bloomedTrees: number;
  effort: CommunityMember[];
  repairs: CommunityMember[];
};
