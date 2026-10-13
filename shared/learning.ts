import type { QuestionKind, QuestionAnswer } from "./question-types";
export type LearningQuestion = {
  kind?: QuestionKind;
  id: string;
  chapterId: string;
  chapterTitle: string;
  text: string;
  choices: string[];
  lesson: string;
};
export type MatrixRow = {
  key: string;
  chapterId: string;
  chapterTitle: string;
  lesson: string;
  available: number;
};
export type LearningChapter = {
  levelMinutes?: number;
  id: string;
  title: string;
  semester: string;
  accuracyBasis: "all" | "latest";
  examAllowed: boolean;
  seconds: number;
  level: number;
  accuracy: number;
  answered: number;
  openCorrections: number;
  tickets: { granted: number; used: number; remaining: number };
  eligible: boolean;
  missing: string[];
};
export type ExamDefinition = {
  delivery?: "online" | "scheduled";
  durationMinutes?: number;
  preparationMinutes?: number;
  startedAt?: number | null;
  id: string;
  title: string;
  startsAt: number;
  closesAt: number;
  tabLimit: number;
  enabled: boolean;
  questionCount: number;
  blockedChapters: { id: string; title: string }[];
};
export type ExamRun = {
  delivery?: "online" | "scheduled";
  id: string;
  title: string;
  kind: "hunt" | "official";
  status: "active" | "submitted";
  startedAt: number;
  deadlineAt: number;
  serverNow: number;
  warnings: number;
  tabLimit: number;
  questions: LearningQuestion[];
  answers: Record<string, QuestionAnswer>;
  score: number | null;
  reason: string | null;
  results?: {
    questionId: string;
    correct: boolean;
    correctIndex: number;
    correctAnswer?: string;
    explanation: string;
  }[];
  revision: number;
};
export type LearningReward = {
  id: string;
  studentName: string;
  label: string;
  points: number;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
};
export type LearningOverview = {
  onlineExams?: boolean;
  levelMinutes?: number;
  canConfigureLevels?: boolean;
  examCreation?: boolean;
  chapters: LearningChapter[];
  matrix: MatrixRow[];
  blueprints: {
    id: string;
    title: string;
    chapterIds: string[];
    questionCount: number;
    weights: Record<string, number>;
  }[];
  exams: ExamDefinition[];
  runs: {
    id: string;
    delivery?: "online" | "scheduled";
    title: string;
    kind: string;
    studentName: string;
    status: string;
    score: number | null;
    deadlineAt: number;
    warnings: number;
  }[];
  reviews: {
    id: string;
    title: string;
    currentIndex: number;
    questionCount: number;
  }[];
  rewards: LearningReward[];
};

export type ExamNotice = {
  id: string;
  classroomId: string;
  classroomName: string;
  subject: string;
  teacherName: string;
  title: string;
  startsAt: number;
  closesAt: number;
  durationMinutes: number;
  preparationMinutes: number;
  questionCount: number;
  runId: string | null;
};
