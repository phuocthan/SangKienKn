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
  id: string;
  title: string;
  questionCount: number;
  lessons: { title: string; questionCount: number }[];
  seconds: number;
  level: number;
  total: number;
  correct: number;
  openCorrections: number;
};
export type Classroom = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  teacherName: string;
  studentCount: number;
  chapters: Chapter[];
};
export type Question = {
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
  correct: boolean;
  correctIndex?: number;
  explanation: string;
  resolved: boolean;
};
export type Student = {
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
export type CommunityMember = {
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
