export type ActivityFile = {
  id: string;
  filename: string;
  size: number;
  mime: string;
};
export type GroupSubmission = {
  id: string;
  version: number;
  submittedAt: number;
  submittedBy: string;
  link: string | null;
  note: string;
  file: ActivityFile | null;
};
export type ActivityGroup = {
  id: string;
  number: number;
  representativeId: string;
  members: {
    id: string;
    name: string;
    active: boolean;
    avatarId?: string | null;
  }[];
  submissions: GroupSubmission[];
};
export type GroupActivitySummary = {
  id: string;
  title: string;
  deadlineAt: number;
  groupCount: number;
  submittedGroups: number;
  myGroupNumber: number | null;
  hasSubmitted: boolean;
};
export type GroupActivity = {
  discussionOpen?: boolean;
  canDiscuss?: boolean;
  myGroupId?: string | null;
  id: string;
  title: string;
  classroomId: string;
  classroomName: string;
  teacherName: string;
  instructions: string;
  requirementText: string;
  requirementFile: ActivityFile | null;
  deadlineAt: number;
  createdAt: number;
  groupCount: number;
  groups: ActivityGroup[];
  extensions: {
    oldDeadlineAt: number;
    deadlineAt: number;
    changedAt: number;
    changedBy: string;
    reason: string;
  }[];
  serverNow: number;
};
export type GroupDiscussionPost = {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorRole: "teacher" | "student";
  authorGroupNumber: number | null;
  kind: "question" | "comment" | "reply";
  body: string;
  createdAt: number;
  submissionVersion: number;
};
