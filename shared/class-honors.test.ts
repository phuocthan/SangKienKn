import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasHonorsMetrics,
  rankClassHonors,
  type HonorsStudent,
} from "./class-honors.js";

const student = (
  id: string,
  values: Partial<HonorsStudent> = {},
): HonorsStudent => ({
  id,
  name: id,
  chapterLevels: [{ level: 3 }],
  answeredQuestions: 50,
  total: 100,
  correct: 50,
  ...values,
});
test("criteria rank by level, answered questions, exact accuracy, then resolved questions", () => {
  const rows = [
    student("most-repairs", {
      chapterLevels: [{ level: 2 }],
      answeredQuestions: 999,
      correct: 100,
    }),
    student("accuracy", { correct: 80 }),
    student("answers", { answeredQuestions: 51, correct: 0 }),
    student("level", {
      chapterLevels: [{ level: 4 }],
      answeredQuestions: 0,
      correct: 0,
    }),
    student("repairs", { correct: 80 }),
  ];
  assert.deepEqual(
    rankClassHonors(
      rows,
      new Map([
        ["most-repairs", 999],
        ["repairs", 4],
      ]),
    ).map((row) => row.id),
    ["level", "answers", "repairs", "accuracy", "most-repairs"],
  );
});
test("highest chapter level represents the tree, without summing chapter levels or using class aggregate level", () => {
  assert.deepEqual(
    rankClassHonors(
      [
        student("many", {
          chapterLevels: [{ level: 2 }, { level: 2 }, { level: 2 }],
        }),
        student("higher", { chapterLevels: [{ level: 3 }] }),
      ],
      new Map(),
    ).map((row) => row.id),
    ["higher", "many"],
  );
});
test("accuracy is not rounded before resolving the ranking", () => {
  const result = rankClassHonors(
    [
      student("rounded-tie-lower", { total: 3000, correct: 2000 }),
      student("rounded-tie-higher", { total: 1000, correct: 667 }),
    ],
    new Map([["rounded-tie-lower", 999]]),
  );
  assert.equal(result[0].id, "rounded-tie-higher");
});
test("equal achievements have deterministic name order; top ten does not mutate source or fabricate entries", () => {
  const source = Array.from({ length: 13 }, (_, i) =>
    student(`HS ${String(13 - i).padStart(2, "0")}`),
  );
  const before = source.map((row) => row.id);
  const ranked = rankClassHonors(source, new Map());
  assert.equal(ranked.length, 10);
  assert.deepEqual(
    ranked.map((row) => row.position),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  assert.equal(ranked[0].id, "HS 01");
  assert.deepEqual(
    source.map((row) => row.id),
    before,
  );
  assert.equal(rankClassHonors([student("only")], new Map()).length, 1);
  assert.deepEqual(rankClassHonors([], new Map()), []);
});
test("missing distinct-question counts or chapter levels are not guessed from attempts", () => {
  const missing = [
    student("old-api", { answeredQuestions: undefined, total: 999 }),
  ];
  assert.equal(hasHonorsMetrics(missing), false);
  assert.deepEqual(rankClassHonors(missing, new Map()), []);
  assert.equal(
    hasHonorsMetrics([student("old", { chapterLevels: undefined })]),
    false,
  );
});
test("a classroom without chapters starts at level one with zero accuracy when no answers exist", () => {
  const ranked = rankClassHonors(
    [
      student("new", {
        chapterLevels: [],
        answeredQuestions: 0,
        total: 0,
        correct: 0,
      }),
    ],
    new Map(),
  );
  assert.equal(ranked[0].treeLevel, 1);
  assert.equal(ranked[0].accuracy, 0);
  assert.equal(ranked[0].resolvedCount, 0);
});
