export type HonorsStudent = {
  id: string;
  name: string;
  avatarId?: string | null;
  chapterLevels?: readonly { level: number }[];
  answeredQuestions?: number;
  correct: number;
  total: number;
};

export type ClassHonoree = HonorsStudent & {
  position: number;
  treeLevel: number;
  answeredCount: number;
  accuracy: number;
  resolvedCount: number;
};

// The server ranks the full roster, then omits other students' accuracy data.
export type VisibleClassHonoree = Omit<
  ClassHonoree,
  "correct" | "total" | "accuracy"
> & {
  correct?: number;
  total?: number;
  accuracy?: number;
};

export function hasHonorsMetrics(students: readonly HonorsStudent[]) {
  return students.every(
    (student) =>
      Array.isArray(student.chapterLevels) &&
      Number.isFinite(student.answeredQuestions),
  );
}

/** Class tree = highest chapter level; neither summed time nor rounded accuracy ranks students. */
export function rankClassHonors(
  students: readonly HonorsStudent[],
  resolved: ReadonlyMap<string, number>,
): ClassHonoree[] {
  if (!hasHonorsMetrics(students)) return [];
  return students
    .map((student) => ({
      ...student,
      treeLevel: Math.max(
        1,
        ...(student.chapterLevels ?? []).map((chapter) => chapter.level),
      ),
      answeredCount: student.answeredQuestions!,
      accuracy: student.total ? student.correct / student.total : 0,
      resolvedCount: resolved.get(student.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.treeLevel - a.treeLevel ||
        b.answeredCount - a.answeredCount ||
        b.accuracy - a.accuracy ||
        b.resolvedCount - a.resolvedCount ||
        a.name.localeCompare(b.name, "vi") ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 10)
    .map((student, index) => ({ ...student, position: index + 1 }));
}
