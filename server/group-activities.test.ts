import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { zipSync, strToU8 } from "fflate";
import { createApp } from "./app.js";
import { hashPassword, openDatabase, seedDemo } from "./db.js";
import { requirementWordText } from "./activity-files.js";
import type { GroupActivity } from "../shared/group-activities.js";

const word = (xml: string) =>
  Buffer.from(zipSync({ "word/document.xml": strToU8(xml) }));
const requirement = word(
  `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Yêu cầu: Tiết kiệm năng lượng</w:t><w:br/><w:t>Thiết kế mô hình</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Nhóm trình bày kết quả</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>`,
);
const pdf = Buffer.from("%PDF-1.7\nSản phẩm nhóm\n%%EOF");
const creation = (overrides = {}) => ({
  title: "Mô hình xanh",
  instructions: "Làm mô hình theo nhóm.",
  deadlineAt: 1060000,
  groupCount: 2,
  requestId: randomUUID(),
  ...overrides,
});
const linkSubmission = (overrides = {}) => ({
  link: "https://www.canva.com/design/demo/view",
  note: "Sản phẩm lần đầu",
  requestId: randomUUID(),
  ...overrides,
});

async function fixture(t: TestContext, path = ":memory:") {
  let db = openDatabase(path);
  seedDemo(db);
  let clock = 1000000;
  function listen() {
    return createApp(db, { now: () => clock, demo: true }).listen(
      0,
      "127.0.0.1",
    );
  }
  let server = listen();
  let base = "";
  async function ready() {
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    base = `http://127.0.0.1:${address.port}/api`;
  }
  await ready();
  const close = () =>
    new Promise<void>((resolve) => server.close(() => resolve()));
  t.after(async () => {
    await close();
    db.close();
  });
  async function raw(path: string, body?: unknown, cookie = "", headers = {}) {
    const multipart = body instanceof FormData;
    return fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Cookie: cookie,
        ...(body === undefined || multipart
          ? {}
          : { "Content-Type": "application/json" }),
        ...headers,
      },
      body:
        body === undefined
          ? undefined
          : multipart
            ? body
            : JSON.stringify(body),
    });
  }
  async function request(
    path: string,
    body?: unknown,
    cookie = "",
    headers = {},
  ) {
    const response = await raw(path, body, cookie, headers);
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  async function login(id: string) {
    const user = db.prepare("SELECT email FROM users WHERE id = ?").get(id)!;
    const result = await request("/auth/login", {
      email: user.email,
      password: "GreenEdu123!",
    });
    assert.equal(result.status, 200);
    return result.cookie;
  }
  return {
    get db() {
      return db;
    },
    request,
    raw,
    login,
    advance: (ms: number) => {
      clock += ms;
    },
    restart: async () => {
      await close();
      db.close();
      db = openDatabase(path);
      server = listen();
      await ready();
    },
  };
}
function multipart(
  fields: Record<string, unknown>,
  field?: string,
  filename?: string,
  data?: Buffer,
) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields))
    form.set(key, String(value));
  if (field) form.set(field, new Blob([new Uint8Array(data!)]), filename);
  return form;
}

test("peer reading and threaded rebuttals open exactly after an extended deadline, enforce group ownership and close on further extension", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher-demo");
  const created = await f.request(
    "/classrooms/class-demo/group-activities",
    creation(),
    teacher,
  );
  const activity: GroupActivity = created.data,
    path = `/group-activities/${activity.id}`;
  const target = activity.groups[0],
    otherGroup = activity.groups[1];
  const owner = await f.login(target.representativeId),
    peer = await f.login(otherGroup.representativeId);
  await f.request(
    `${path}/submissions`,
    multipart({ requestId: randomUUID() }, "product", "sản phẩm.pdf", pdf),
    owner,
  );
  const snapshot = (await f.request(path, undefined, teacher))
    .data as GroupActivity;
  const file = snapshot.groups[0].submissions[0].file!;
  const discussion = `${path}/groups/${target.id}/discussion`;
  const question = {
    kind: "question",
    body: "Nhóm giải thích cách đo nhé?",
    requestId: randomUUID(),
  };
  assert.equal((await f.request(discussion, question, peer)).status, 409);
  f.advance(60000);
  assert.equal(
    (await f.request(path, undefined, peer)).data.discussionOpen,
    false,
  );
  assert.equal(
    (await f.raw(`/group-files/${file.id}`, undefined, peer)).status,
    403,
  );
  const firstExtension = await f.request(
    `${path}/deadline`,
    {
      expectedDeadlineAt: 1060000,
      deadlineAt: 1080000,
      reason: "Thêm thời gian",
    },
    teacher,
  );
  assert.equal(firstExtension.status, 200);
  f.advance(19999);
  assert.equal((await f.request(discussion, question, peer)).status, 409);
  f.advance(1);
  const visible = (await f.request(path, undefined, peer))
    .data as GroupActivity;
  assert.equal(visible.discussionOpen, true);
  assert.equal(visible.groups.length, 2);
  assert.equal(visible.myGroupId, otherGroup.id);
  assert.equal(
    (await f.raw(`/group-files/${file.id}`, undefined, peer)).status,
    200,
  );
  assert.equal(
    (await f.request(`${path}/submissions`, linkSubmission(), owner)).status,
    410,
  );
  assert.equal((await f.request(discussion, question, owner)).status, 403);
  assert.equal(
    (await f.request(discussion, { ...question, body: " " }, peer)).status,
    400,
  );
  assert.equal(
    (await f.request(discussion, { ...question, kind: "reply" }, peer)).status,
    400,
  );
  const root = await f.request(discussion, question, peer);
  assert.equal(root.status, 201);
  assert.equal(root.data.posts.length, 1);
  const rootId = root.data.posts[0].id;
  assert.equal(
    (await f.request(discussion, question, peer)).data.posts.length,
    1,
  );
  assert.equal(
    (await f.request(discussion, { ...question, body: "Khác" }, peer)).status,
    409,
  );
  const reply = {
    parentId: rootId,
    body: "Nhóm dùng thước và đo ba lần.",
    requestId: randomUUID(),
  };
  assert.equal((await f.request(discussion, reply, peer)).status, 403);
  const answer = await f.request(discussion, reply, owner);
  assert.equal(answer.status, 201);
  assert.equal(answer.data.posts.length, 2);
  assert.equal(answer.data.posts[1].parentId, rootId);
  assert.equal(answer.data.posts[1].submissionVersion, 1);
  assert.equal(
    (await f.request(discussion, reply, owner)).data.posts.length,
    2,
  );
  assert.equal(
    (
      await f.request(
        `${path}/groups/${otherGroup.id}/discussion`,
        { ...reply, requestId: randomUUID() },
        peer,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await f.request(
        discussion,
        {
          ...reply,
          parentId: answer.data.posts[1].id,
          requestId: randomUUID(),
        },
        owner,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await f.request(
        discussion,
        {
          body: "Các nhóm chú ý ghi đơn vị.",
          kind: "comment",
          requestId: randomUUID(),
        },
        teacher,
      )
    ).status,
    201,
  );
  f.db
    .prepare(
      "DELETE FROM memberships WHERE classroom_id='class-demo' AND student_id=?",
    )
    .run(otherGroup.representativeId);
  assert.equal((await f.request(discussion, undefined, peer)).status, 403);
  assert.equal(
    (await f.raw(`/group-files/${file.id}`, undefined, peer)).status,
    403,
  );
  const extended = await f.request(
    `${path}/deadline`,
    { expectedDeadlineAt: 1080000, deadlineAt: 1100000 },
    teacher,
  );
  assert.equal(extended.data.discussionOpen, false);
  assert.equal((await f.request(discussion, undefined, owner)).status, 409);
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM group_discussion_posts").get()!.n,
    3,
  );
  f.advance(20000);
  assert.equal(
    (await f.request(discussion, undefined, owner)).data.posts.length,
    3,
  );
  assert.equal(f.db.prepare("PRAGMA foreign_key_check").all().length, 0);
});

test("group creation is balanced, complete, stable and idempotent; validates count, requirements and deadline", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher-demo");
  for (const invalid of [
    creation({ groupCount: 0 }),
    creation({ groupCount: 4 }),
    creation({ groupCount: 1.5 }),
    creation({ deadlineAt: 1000000 }),
    creation({ instructions: "" }),
  ])
    assert.equal(
      (
        await f.request(
          "/classrooms/class-demo/group-activities",
          invalid,
          teacher,
        )
      ).status,
      400,
    );
  const body = creation();
  const response = await f.request(
    "/classrooms/class-demo/group-activities",
    body,
    teacher,
  );
  assert.equal(response.status, 201);
  const activity: GroupActivity = response.data;
  assert.deepEqual(activity.groups.map((g) => g.members.length).sort(), [1, 2]);
  assert.deepEqual(
    activity.groups.flatMap((g) => g.members.map((m) => m.id)).sort(),
    ["student-2", "student-3", "student-demo"],
  );
  assert.ok(
    activity.groups.every((g) =>
      g.members.some((m) => m.id === g.representativeId),
    ),
  );
  assert.deepEqual(
    (await f.request(`/group-activities/${activity.id}`, undefined, teacher))
      .data,
    activity,
  );
  assert.deepEqual(
    (await f.request("/classrooms/class-demo/group-activities", body, teacher))
      .data,
    activity,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/group-activities",
        { ...body, title: "Khác" },
        teacher,
      )
    ).status,
    409,
  );
  const all = await f.request(
    "/classrooms/class-demo/group-activities",
    undefined,
    teacher,
  );
  assert.equal(all.data.activities.length, 1);
  assert.equal(all.data.activities[0].submittedGroups, 0);
  const room = await f.request(
    "/classrooms",
    { name: "Lớp rỗng", grade: "10", subject: "Lý" },
    teacher,
  );
  assert.equal(
    (
      await f.request(
        `/classrooms/${room.data.id}/group-activities`,
        creation(),
        teacher,
      )
    ).status,
    400,
  );
});

test("Word requirements preserve Vietnamese, tables and line breaks, download original and reject invalid or oversized uploads", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher-demo"),
    student = await f.login("student-demo");
  assert.equal(
    requirementWordText(requirement),
    "Yêu cầu: Tiết kiệm năng lượng\nThiết kế mô hình\n\nNhóm trình bày kết quả",
  );
  assert.match(
    requirementWordText(
      readFileSync("public/templates/greenedu-cau-hoi-mau.docx"),
    ),
    /Mét/,
  );
  const fields = creation({ instructions: "" });
  const upload = () =>
    multipart(fields, "requirement", "Yêu cầu nhóm.docx", requirement);
  const response = await f.request(
    "/classrooms/class-demo/group-activities",
    upload(),
    teacher,
  );
  assert.equal(response.status, 201);
  assert.match(response.data.requirementText, /Tiết kiệm/);
  assert.equal(response.data.requirementFile.filename, "Yêu cầu nhóm.docx");
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/group-activities",
        upload(),
        teacher,
      )
    ).data.id,
    response.data.id,
  );
  const path = `/group-files/${response.data.requirementFile.id}`;
  for (const cookie of [teacher, student]) {
    const download = await f.raw(path, undefined, cookie);
    assert.equal(download.status, 200);
    assert.match(download.headers.get("content-disposition")!, /attachment/);
    assert.equal(download.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), requirement);
  }
  assert.equal((await f.request(path)).status, 401);
  for (const [name, buffer] of [
    ["old.doc", requirement],
    ["broken.docx", Buffer.from("not zip")],
    ["invalid.docx", word("<broken>")],
    [
      "entity.docx",
      word('<!DOCTYPE w:document [<!ENTITY x "hi">]><w:document/>'),
    ],
  ] as [string, Buffer][]) {
    assert.equal(
      (
        await f.request(
          "/classrooms/class-demo/group-activities",
          multipart(creation(), "requirement", name, buffer),
          teacher,
        )
      ).status,
      400,
    );
  }
  const oversized = multipart(
    creation(),
    "requirement",
    "large.docx",
    Buffer.alloc(5 * 1024 * 1024 + 1),
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/group-activities",
        oversized,
        teacher,
      )
    ).status,
    413,
  );
  assert.equal(
    (f.db.prepare("SELECT COUNT(*) n FROM activity_files").get() as any).n,
    1,
  );
});

test("activity permissions restrict classes, student view and submission files to their own group", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher-demo"),
    student = await f.login("student-demo");
  f.db
    .prepare(
      "INSERT INTO users (id,email,name,password,role) VALUES (?,?,?,?,?)",
    )
    .run(
      "other-teacher",
      "other@demo.test",
      "Other",
      hashPassword("GreenEdu123!"),
      "teacher",
    );
  const other = await f.login("other-teacher");
  const created = await f.request(
    "/classrooms/class-demo/group-activities",
    creation(),
    teacher,
  );
  const activity: GroupActivity = created.data,
    path = `/group-activities/${activity.id}`;
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/group-activities",
        creation(),
        student,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/group-activities",
        undefined,
        other,
      )
    ).status,
    403,
  );
  assert.equal((await f.request(path, undefined, other)).status, 403);
  const visible = (await f.request(path, undefined, student)).data;
  assert.equal(visible.groups.length, 1);
  assert.ok(
    visible.groups[0].members.some((m: any) => m.id === "student-demo"),
  );
  assert.equal(JSON.stringify(visible).includes("greenedu.nk"), false);
  const group = activity.groups[0],
    rep = await f.login(group.representativeId);
  const uploaded = await f.request(
    `${path}/submissions`,
    multipart({ requestId: randomUUID() }, "product", "bài nhóm.pdf", pdf),
    rep,
  );
  assert.equal(uploaded.status, 201);
  const result: GroupActivity = (await f.request(path, undefined, teacher))
    .data;
  const file = result.groups[0].submissions[0].file!;
  const outsider = await f.login(activity.groups[1].members[0].id);
  assert.equal(
    (await f.request(`/group-files/${file.id}`, undefined, outsider)).status,
    403,
  );
  assert.equal(
    (await f.request(`/group-files/${file.id}`, undefined, other)).status,
    403,
  );
  assert.equal(
    (await f.raw(`/group-files/${file.id}`, undefined, rep)).status,
    200,
  );
  assert.equal(
    (await f.raw(`/group-files/${file.id}`, undefined, teacher)).status,
    200,
  );
  assert.equal(
    (await f.request(`${path}/submissions`, linkSubmission(), teacher)).status,
    403,
  );
  f.db
    .prepare(
      "DELETE FROM memberships WHERE classroom_id='class-demo' AND student_id=?",
    )
    .run(group.representativeId);
  assert.equal((await f.request(path, undefined, rep)).status, 403);
  assert.equal(
    (await f.request(`/group-files/${file.id}`, undefined, rep)).status,
    403,
  );
});

test("only a current group representative submits; teacher can change representative but cannot move students across groups", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher-demo");
  const activity: GroupActivity = (
    await f.request(
      "/classrooms/class-demo/group-activities",
      creation(),
      teacher,
    )
  ).data;
  const group = activity.groups.find((g) => g.members.length === 2)!,
    outsider = activity.groups.find((g) => g.id !== group.id)!;
  const otherMember = group.members.find(
    (m) => m.id !== group.representativeId,
  )!;
  const member = await f.login(otherMember.id),
    oldRep = await f.login(group.representativeId);
  const path = `/group-activities/${activity.id}`,
    change = `${path}/groups/${group.id}/representative`;
  assert.equal(
    (await f.request(`${path}/submissions`, linkSubmission(), member)).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        change,
        {
          studentId: otherMember.id,
          expectedRepresentativeId: group.representativeId,
        },
        member,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        change,
        {
          studentId: outsider.representativeId,
          expectedRepresentativeId: group.representativeId,
        },
        teacher,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.request(
        change,
        {
          studentId: otherMember.id,
          expectedRepresentativeId: group.representativeId,
        },
        teacher,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await f.request(
        change,
        {
          studentId: otherMember.id,
          expectedRepresentativeId: group.representativeId,
        },
        teacher,
      )
    ).status,
    409,
  );
  assert.equal(
    (await f.request(`${path}/submissions`, linkSubmission(), oldRep)).status,
    403,
  );
  assert.equal(
    (await f.request(`${path}/submissions`, linkSubmission(), member)).status,
    201,
  );
  f.db
    .prepare(
      "DELETE FROM memberships WHERE student_id=? AND classroom_id='class-demo'",
    )
    .run(group.representativeId);
  assert.equal(
    (
      await f.request(
        change,
        {
          studentId: group.representativeId,
          expectedRepresentativeId: otherMember.id,
        },
        teacher,
      )
    ).status,
    400,
  );
  f.db
    .prepare(
      "INSERT INTO users (id,email,name,password,role) VALUES (?,?,?,?,?)",
    )
    .run(
      "new-student",
      "new@demo.test",
      "Mới",
      hashPassword("GreenEdu123!"),
      "student",
    );
  f.db
    .prepare("INSERT INTO memberships VALUES (?,?)")
    .run("class-demo", "new-student");
  const newcomer = await f.login("new-student");
  assert.deepEqual(
    (await f.request(path, undefined, newcomer)).data.groups,
    [],
  );
  assert.equal(
    (await f.request(`${path}/submissions`, linkSubmission(), newcomer)).status,
    403,
  );
});

test("deadline is enforced at the exact server boundary; retries survive expiry and only teacher extensions reopen submissions", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher-demo");
  const body = creation({ groupCount: 1, deadlineAt: 1001000 });
  const activity: GroupActivity = (
    await f.request("/classrooms/class-demo/group-activities", body, teacher)
  ).data;
  const student = await f.login(activity.groups[0].representativeId),
    path = `/group-activities/${activity.id}`;
  f.advance(999);
  const submission = linkSubmission(),
    accepted = await f.request(`${path}/submissions`, submission, student);
  assert.equal(accepted.status, 201);
  assert.equal(accepted.data.submittedAt, 1000999);
  f.advance(1);
  assert.equal(
    (await f.request(`${path}/submissions`, linkSubmission(), student)).status,
    410,
  );
  assert.equal(
    (await f.request(`${path}/submissions`, submission, student)).data.id,
    accepted.data.id,
  );
  assert.equal(
    (await f.request("/classrooms/class-demo/group-activities", body, teacher))
      .data.id,
    activity.id,
  );
  const extension = {
    deadlineAt: 1010000,
    expectedDeadlineAt: 1001000,
    reason: "Thêm thời gian hoàn thiện",
  };
  assert.equal(
    (await f.request(`${path}/deadline`, extension, student)).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        `${path}/deadline`,
        { ...extension, deadlineAt: 1001000 },
        teacher,
      )
    ).status,
    400,
  );
  const extended = await f.request(`${path}/deadline`, extension, teacher);
  assert.equal(extended.status, 200);
  assert.equal(extended.data.extensions.length, 1);
  assert.equal(extended.data.extensions[0].oldDeadlineAt, 1001000);
  assert.equal(extended.data.extensions[0].reason, extension.reason);
  assert.equal(
    (await f.request(`${path}/deadline`, extension, teacher)).status,
    409,
  );
  assert.equal(
    (await f.request(`${path}/submissions`, linkSubmission(), student)).status,
    201,
  );
  assert.equal(
    (f.db.prepare("SELECT COUNT(*) n FROM group_submissions").get() as any).n,
    2,
  );
  assert.equal(
    (f.db.prepare("SELECT COUNT(*) n FROM activity_files").get() as any).n,
    0,
  );
});

test("submission versions retain files, links and author history; same request retries cannot create duplicates or change content", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher-demo");
  const activity: GroupActivity = (
    await f.request(
      "/classrooms/class-demo/group-activities",
      creation({ groupCount: 1 }),
      teacher,
    )
  ).data;
  const rep = await f.login(activity.groups[0].representativeId),
    path = `/group-activities/${activity.id}`;
  const fields = { requestId: randomUUID(), note: "Bản PDF" },
    upload = () => multipart(fields, "product", "Sản phẩm.pdf", pdf);
  const first = await f.request(`${path}/submissions`, upload(), rep);
  assert.equal(first.status, 201);
  assert.equal(first.data.version, 1);
  assert.deepEqual(
    (await f.request(`${path}/submissions`, upload(), rep)).data,
    first.data,
  );
  assert.equal(
    (
      await f.request(
        `${path}/submissions`,
        multipart(
          fields,
          "product",
          "Sản phẩm.pdf",
          Buffer.from("%PDF-changed"),
        ),
        rep,
      )
    ).status,
    409,
  );
  f.advance(500);
  assert.equal(
    (await f.request(`${path}/submissions`, linkSubmission(), rep)).data
      .version,
    2,
  );
  const next = (await f.request(path, undefined, teacher)).data.groups[0]
    .submissions;
  assert.equal(next.length, 2);
  assert.ok(next[0].link);
  assert.ok(next[1].file);
  assert.equal(next[1].file.filename, "Sản phẩm.pdf");
  assert.equal(next[1].submittedAt, 1000000);
  const download = await f.raw(
    `/group-files/${next[1].file.id}`,
    undefined,
    rep,
  );
  assert.equal(download.headers.get("content-type"), "application/pdf");
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdf);
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/group-activities",
        undefined,
        teacher,
      )
    ).data.activities[0].submittedGroups,
    1,
  );
  const memberId = activity.groups[0].members.find(
    (m) => m.id !== activity.groups[0].representativeId,
  )!.id;
  const member = await f.login(memberId);
  assert.equal(
    (
      await f.request(
        `${path}/submissions`,
        multipart(fields, "product", "Sản phẩm.pdf", pdf),
        member,
      )
    ).status,
    409,
  );
  await f.request(
    `${path}/groups/${activity.groups[0].id}/representative`,
    {
      studentId: memberId,
      expectedRepresentativeId: activity.groups[0].representativeId,
    },
    teacher,
  );
  assert.equal(
    (await f.request(`${path}/submissions`, upload(), rep)).status,
    200,
  );
  assert.equal(
    (await f.request(`${path}/submissions`, linkSubmission(), member)).data
      .version,
    3,
  );
});

test("product validation accepts Office and PDF or HTTP links; rejects executable formats, invalid signatures, excess uploads and cross-origin multipart", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher-demo");
  const activity: GroupActivity = (
    await f.request(
      "/classrooms/class-demo/group-activities",
      creation({ groupCount: 1 }),
      teacher,
    )
  ).data;
  const rep = await f.login(activity.groups[0].representativeId),
    path = `/group-activities/${activity.id}/submissions`;
  for (const link of [
    "javascript:alert(1)",
    "data:text/html,test",
    "ftp://test.test",
    "https://user:secret@example.com/a",
    "bad",
  ])
    assert.equal(
      (await f.request(path, linkSubmission({ link }), rep)).status,
      400,
    );
  assert.equal(
    (await f.request(path, { requestId: randomUUID() }, rep)).status,
    400,
  );
  assert.equal(
    (
      await f.request(
        path,
        multipart(linkSubmission(), "product", "a.pdf", pdf),
        rep,
      )
    ).status,
    400,
  );
  for (const [name, buffer] of [
    ["test.html", pdf],
    ["test.pdf", Buffer.from("<html>")],
    ["test.docx", pdf],
    ["test.pptx", requirement],
    ["test.doc", pdf],
  ] as [string, Buffer][])
    assert.equal(
      (
        await f.request(
          path,
          multipart({ requestId: randomUUID() }, "product", name, buffer),
          rep,
        )
      ).status,
      400,
    );
  assert.equal(
    (
      await f.request(
        path,
        multipart(
          { requestId: randomUUID() },
          "product",
          "big.pdf",
          Buffer.alloc(10 * 1024 * 1024 + 1),
        ),
        rep,
      )
    ).status,
    413,
  );
  assert.equal(
    (
      await f.request(
        path,
        multipart({ requestId: randomUUID() }, "product", "a.pdf", pdf),
        rep,
        { Origin: "https://evil.test" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        path,
        multipart({ requestId: randomUUID() }, "product", "a.pdf", pdf),
        rep,
        { "Sec-Fetch-Site": "cross-site" },
      )
    ).status,
    403,
  );
  const wrong = multipart(
    { requestId: randomUUID() },
    "unexpected",
    "a.pdf",
    pdf,
  );
  assert.equal((await f.request(path, wrong, rep)).status, 400);
  assert.equal(
    (f.db.prepare("SELECT COUNT(*) n FROM group_submissions").get() as any).n,
    0,
  );
  const ole = Buffer.from("d0cf11e0a1b11ae100000000", "hex");
  for (const [name, buffer] of [
    ["a.docx", requirement],
    [
      "a.pptx",
      Buffer.from(
        zipSync({ "ppt/presentation.xml": strToU8("<p:presentation/>") }),
      ),
    ],
    ["a.doc", ole],
    ["a.ppt", ole],
    ["a.pdf", pdf],
  ] as [string, Buffer][])
    assert.equal(
      (
        await f.request(
          path,
          multipart({ requestId: randomUUID() }, "product", name, buffer),
          rep,
        )
      ).status,
      201,
    );
});

test("group snapshot, Word, products and extensions persist through server restart without altering existing classes and questions", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "greenedu-groups-"));
  const f = await fixture(t, join(directory, "app.sqlite")),
    teacher = await f.login("teacher-demo");
  // Windows cannot remove SQLite files before the fixture closes the database.
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const created = await f.request(
    "/classrooms/class-demo/group-activities",
    multipart(creation(), "requirement", "a.docx", requirement),
    teacher,
  );
  assert.equal(created.status, 201);
  const activity: GroupActivity = created.data,
    rep = await f.login(activity.groups[0].representativeId);
  await f.request(
    `/group-activities/${activity.id}/submissions`,
    multipart({ requestId: randomUUID() }, "product", "a.pdf", pdf),
    rep,
  );
  await f.request(
    `/group-activities/${activity.id}/deadline`,
    { deadlineAt: 1070000, expectedDeadlineAt: activity.deadlineAt },
    teacher,
  );
  f.advance(70000);
  const peer = await f.login(activity.groups[1].representativeId);
  const discussionPath = `/group-activities/${activity.id}/groups/${activity.groups[0].id}/discussion`;
  const discussionBefore = await f.request(
    discussionPath,
    {
      kind: "question",
      body: "Sản phẩm hoạt động thế nào?",
      requestId: randomUUID(),
    },
    peer,
  );
  assert.equal(discussionBefore.status, 201);
  const before = (
    await f.request(`/group-activities/${activity.id}`, undefined, teacher)
  ).data;
  await f.restart();
  const after = (
    await f.request(`/group-activities/${activity.id}`, undefined, teacher)
  ).data;
  assert.deepEqual(after, before);
  assert.deepEqual(
    (await f.request(discussionPath, undefined, peer)).data,
    discussionBefore.data,
  );
  assert.deepEqual(
    Buffer.from(
      await (
        await f.raw(
          `/group-files/${after.requirementFile.id}`,
          undefined,
          teacher,
        )
      ).arrayBuffer(),
    ),
    requirement,
  );
  assert.deepEqual(
    Buffer.from(
      await (
        await f.raw(
          `/group-files/${after.groups[0].submissions[0].file.id}`,
          undefined,
          rep,
        )
      ).arrayBuffer(),
    ),
    pdf,
  );
  assert.equal(
    (f.db.prepare("SELECT COUNT(*) n FROM questions").get() as any).n,
    9,
  );
  assert.equal(
    (f.db.prepare("SELECT COUNT(*) n FROM memberships").get() as any).n,
    3,
  );
  assert.deepEqual(f.db.prepare("PRAGMA foreign_key_check").all(), []);
});
