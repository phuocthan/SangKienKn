export type FeedbackStatus = "new" | "replied" | "closed";
export type FeedbackMessage = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: "teacher" | "student";
  body: string;
  createdAt: number;
};
export type FeedbackThread = {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  status: FeedbackStatus;
  createdAt: number;
  updatedAt: number;
  messages: FeedbackMessage[];
};
