import type { DatabaseSync } from "node:sqlite";

export function ensureGroupDiscussionSchema(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS group_discussion_posts (
    id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES activity_groups(id),
    parent_id TEXT, submission_id TEXT NOT NULL REFERENCES group_submissions(id),
    author_id TEXT NOT NULL REFERENCES users(id), author_group_number INTEGER,
    kind TEXT NOT NULL CHECK(kind IN ('question','comment','reply')),
    body TEXT NOT NULL, created_at INTEGER NOT NULL, request_id TEXT NOT NULL,
    UNIQUE(id,group_id), UNIQUE(author_id,request_id),
    FOREIGN KEY(parent_id,group_id) REFERENCES group_discussion_posts(id,group_id),
    CHECK((parent_id IS NULL AND kind IN ('question','comment')) OR (parent_id IS NOT NULL AND kind='reply'))
  );
  CREATE INDEX IF NOT EXISTS group_discussion_target ON group_discussion_posts(group_id,created_at);`);
}
export function groupDiscussionOpen(
  db: DatabaseSync,
  activity: { id: string; deadline_at: number },
  now: number,
) {
  return (
    now >= activity.deadline_at &&
    !!db
      .prepare(
        "SELECT 1 FROM activity_deadline_history WHERE activity_id=? LIMIT 1",
      )
      .get(activity.id)
  );
}
