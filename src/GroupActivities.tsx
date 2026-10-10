import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  Clock3,
  Download,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { api, errorMessage } from "./api";
import { Empty, Modal, SectionTitle } from "./components";
import type { Classroom, User } from "./types";
import type {
  ActivityFile,
  ActivityGroup,
  GroupActivity,
  GroupActivitySummary,
} from "../shared/group-activities";

const date = (value: number) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
const localInput = (value: number) => {
  const time = new Date(value);
  return new Date(value - time.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
const fileSize = (value: number) =>
  value < 1024 * 1024
    ? `${Math.ceil(value / 1024)} KB`
    : `${(value / (1024 * 1024)).toFixed(1)} MB`;
function FileLink({ file }: { file: ActivityFile }) {
  return (
    <a className="group-file" href={`/api/group-files/${file.id}`}>
      <Download size={16} />
      <span>
        {file.filename} <small>({fileSize(file.size)})</small>
      </span>
    </a>
  );
}

export function GroupActivities({
  classroom,
  user,
}: {
  classroom: Classroom;
  user: User;
}) {
  const teacher = user.role === "teacher";
  const [activities, setActivities] = useState<GroupActivitySummary[]>([]);
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState<GroupActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [extending, setExtending] = useState(false);
  const [notice, setNotice] = useState("");
  const sequence = useRef(0);
  const anchor = useRef({ server: 0, elapsed: performance.now() });
  const [now, setNow] = useState(0);
  const refresh = useCallback(
    async (id: string, silent = false) => {
      const ticket = ++sequence.current;
      if (!silent) setLoading(true);
      try {
        const [list, activity] = await Promise.all([
          api<{ activities: GroupActivitySummary[]; serverNow: number }>(
            `/classrooms/${classroom.id}/group-activities`,
          ),
          id
            ? api<GroupActivity>(`/group-activities/${id}`)
            : Promise.resolve(null),
        ]);
        if (ticket !== sequence.current) return;
        setActivities(list.activities);
        setDetail(activity);
        anchor.current = {
          server: activity?.serverNow ?? list.serverNow,
          elapsed: performance.now(),
        };
        setNow(anchor.current.server);
        setError("");
      } catch (e) {
        if (ticket === sequence.current) setError(errorMessage(e));
      } finally {
        if (ticket === sequence.current) setLoading(false);
      }
    },
    [classroom.id],
  );
  useEffect(() => {
    void refresh(selected);
    const poll = setInterval(() => void refresh(selected, true), 20000);
    const focus = () => void refresh(selected, true);
    window.addEventListener("focus", focus);
    return () => {
      sequence.current++;
      clearInterval(poll);
      window.removeEventListener("focus", focus);
    };
  }, [refresh, selected]);
  useEffect(() => {
    const timer = setInterval(
      () =>
        setNow(
          anchor.current.server + performance.now() - anchor.current.elapsed,
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  const updated = async (message: string) => {
    setNotice(message);
    await refresh(selected, true);
  };
  const closeCreate = useCallback(() => setCreating(false), []);
  const closeExtend = useCallback(() => setExtending(false), []);
  const createButton = (
    <button
      className="button primary"
      disabled={!classroom.studentCount}
      onClick={() => setCreating(true)}
    >
      <Plus size={16} />
      Tạo hoạt động
    </button>
  );

  return (
    <div className="group-workspace">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CÙNG NHAU HỌC, CÙNG NHAU HOÀN THÀNH</span>
          <h1>Hoạt động nhóm</h1>
          <p>
            {classroom.name} ·{" "}
            {teacher
              ? "Giao yêu cầu, chia nhóm ngẫu nhiên và theo dõi sản phẩm."
              : "Xem nhóm của bạn, yêu cầu và các sản phẩm đã nộp."}
          </p>
        </div>
        {teacher && createButton}
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <p className="subtle-note" role="status">
          {notice}
        </p>
      )}
      <div className="group-toolbar">
        {selected && (
          <button
            className="text-button"
            onClick={() => {
              setSelected("");
              setDetail(null);
              setNotice("");
            }}
          >
            <ArrowLeft size={16} />
            Danh sách hoạt động
          </button>
        )}
        <button
          className="button outline"
          disabled={loading}
          onClick={() => void refresh(selected)}
        >
          <RefreshCw size={16} />
          Cập nhật
        </button>
      </div>
      {loading && <p role="status">Đang tải hoạt động…</p>}
      {!selected &&
        !loading &&
        (activities.length ? (
          <div className="group-activity-grid">
            {activities.map((activity) => (
              <button
                key={activity.id}
                className="card group-activity-card"
                onClick={() => {
                  setSelected(activity.id);
                  setNotice("");
                }}
              >
                <span className="group-status">
                  {now >= activity.deadlineAt ? "Đã hết hạn" : "Đang nhận bài"}
                </span>
                <h2>{activity.title}</h2>
                <p>
                  <Clock3 size={16} />
                  Hạn nộp: {date(activity.deadlineAt)}
                </p>
                <p>
                  <Users size={16} />
                  {teacher
                    ? `${activity.submittedGroups}/${activity.groupCount} nhóm đã nộp`
                    : activity.myGroupNumber
                      ? `Nhóm ${activity.myGroupNumber} · ${activity.hasSubmitted ? "Đã nộp bài" : "Chưa nộp bài"}`
                      : "Bạn chưa được phân nhóm"}
                </p>
                <span className="text-button">Xem hoạt động →</span>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            title="Chưa có hoạt động nhóm"
            text={
              teacher
                ? "Thêm học sinh vào lớp, rồi tạo hoạt động và số nhóm muốn chia."
                : "Hoạt động sẽ xuất hiện khi giáo viên giao bài cho lớp."
            }
          />
        ))}
      {selected && detail && (
        <>
          <section className="card group-requirements">
            <div className="group-section-head">
              <div>
                <span className="eyebrow">
                  {detail.classroomName} · {detail.teacherName}
                </span>
                <h2>{detail.title}</h2>
              </div>
              <span className="group-status">
                {now >= detail.deadlineAt ? "Đã hết hạn nộp" : "Đang nhận bài"}
              </span>
            </div>
            <p className="group-deadline">
              <Clock3 size={18} />
              <strong>Hạn nộp: {date(detail.deadlineAt)}</strong>
            </p>
            {teacher && (
              <button
                className="button outline"
                onClick={() => setExtending(true)}
              >
                Gia hạn nộp bài
              </button>
            )}
            <h3>Yêu cầu hoạt động</h3>
            {detail.instructions && (
              <div className="group-instructions">{detail.instructions}</div>
            )}
            {detail.requirementText && (
              <div className="group-word-text">{detail.requirementText}</div>
            )}
            {detail.requirementFile && (
              <>
                <FileLink file={detail.requirementFile} />
                <p className="subtle-note">
                  Nội dung chữ từ Word được hiển thị ở trên. Tải bản gốc để xem
                  hình ảnh và bố cục đầy đủ.
                </p>
              </>
            )}
            {!!detail.extensions.length && (
              <details className="group-extensions">
                <summary>Lịch sử gia hạn ({detail.extensions.length})</summary>
                {detail.extensions.map((extension, index) => (
                  <p key={index}>
                    {date(extension.oldDeadlineAt)} →{" "}
                    <strong>{date(extension.deadlineAt)}</strong>
                    <br />
                    <small>
                      {extension.changedBy} · {date(extension.changedAt)}
                      {extension.reason && ` · ${extension.reason}`}
                    </small>
                  </p>
                ))}
              </details>
            )}
          </section>
          <SectionTitle
            title={
              teacher ? `Danh sách ${detail.groupCount} nhóm` : "Nhóm của bạn"
            }
            description={
              teacher
                ? "Nhóm được chia ngẫu nhiên và giữ cố định. Mỗi nhóm có một đại diện nộp bài."
                : "Cùng chuẩn bị sản phẩm; đại diện nộp bài cho cả nhóm trước hạn."
            }
          />
          {!detail.groups.length && (
            <Empty
              title="Bạn chưa được phân nhóm"
              text="Danh sách nhóm được chốt khi tạo hoạt động. Hãy liên hệ giáo viên nếu bạn vào lớp sau thời điểm đó."
            />
          )}
          <div className="group-roster-grid">
            {detail.groups.map((group) => (
              <section className="card group-roster" key={group.id}>
                <div className="group-section-head">
                  <h3>Nhóm {group.number}</h3>
                  <span className="group-status">
                    {group.submissions.length ? "Đã nộp bài" : "Chưa nộp bài"}
                  </span>
                </div>
                <ul className="group-members">
                  {group.members.map((member) => (
                    <li key={member.id}>
                      <span>
                        {member.name}
                        {!member.active && " · Đã rời lớp"}
                      </span>
                      {member.id === group.representativeId && (
                        <small>Đại diện</small>
                      )}
                    </li>
                  ))}
                </ul>
                {teacher ? (
                  <Representative
                    key={group.representativeId}
                    activity={detail}
                    group={group}
                    onUpdate={() => updated("Đã cập nhật đại diện nhóm.")}
                  />
                ) : group.representativeId === user.id ? (
                  now < detail.deadlineAt ? (
                    <SubmissionForm
                      activity={detail}
                      group={group}
                      onUpdate={() => updated("Đã nhận bài nộp của nhóm.")}
                      onRefresh={() => refresh(selected, true)}
                    />
                  ) : (
                    <p className="subtle-note" role="status">
                      Đã hết hạn nộp bài. Giáo viên cần gia hạn để nhóm nộp
                      thêm.
                    </p>
                  )
                ) : (
                  <p className="subtle-note">
                    Đại diện{" "}
                    {
                      group.members.find(
                        (member) => member.id === group.representativeId,
                      )?.name
                    }{" "}
                    sẽ nộp sản phẩm cho nhóm.
                  </p>
                )}
                <h3>Sản phẩm đã nộp</h3>
                {!group.submissions.length && (
                  <p className="subtle-note">Chưa có sản phẩm.</p>
                )}
                {group.submissions.map((submission, index) => (
                  <article className="group-submission" key={submission.id}>
                    <strong>
                      Lần {submission.version}
                      {index === 0 && " · Mới nhất"}
                    </strong>
                    <p>
                      <small>
                        {submission.submittedBy} ·{" "}
                        {date(submission.submittedAt)}
                      </small>
                    </p>
                    {submission.file && <FileLink file={submission.file} />}
                    {submission.link && (
                      <a
                        className="group-product-link"
                        href={submission.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Mở sản phẩm: {submission.link}
                      </a>
                    )}
                    {submission.note && (
                      <p className="group-instructions">{submission.note}</p>
                    )}
                  </article>
                ))}
              </section>
            ))}
          </div>
        </>
      )}
      {creating && (
        <CreateActivity
          classroom={classroom}
          onClose={closeCreate}
          onCreated={(activity) => {
            setCreating(false);
            setSelected(activity.id);
            setNotice("Đã tạo hoạt động và chia nhóm ngẫu nhiên.");
          }}
        />
      )}
      {extending && detail && (
        <ExtendActivity
          activity={detail}
          onClose={closeExtend}
          onUpdated={async () => {
            setExtending(false);
            await updated("Đã gia hạn nộp bài.");
          }}
        />
      )}
    </div>
  );
}

function CreateActivity({
  classroom,
  onClose,
  onCreated,
}: {
  classroom: Classroom;
  onClose: () => void;
  onCreated: (activity: GroupActivity) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const file = data.get("requirement") as File;
    if (!file.size) data.delete("requirement");
    if (file.size > 5 * 1024 * 1024) {
      setError("File yêu cầu vượt quá 5 MB.");
      return;
    }
    if (!String(data.get("instructions")).trim() && !file.size) {
      setError("Nhập yêu cầu hoặc tải file Word có nội dung chữ.");
      return;
    }
    data.set(
      "deadlineAt",
      String(new Date(String(data.get("deadlineAt"))).getTime()),
    );
    data.set("requestId", requestId.current);
    setBusy(true);
    try {
      onCreated(
        await api<GroupActivity>(
          `/classrooms/${classroom.id}/group-activities`,
          data,
        ),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Tạo hoạt động nhóm" onClose={onClose}>
      <form
        onSubmit={(event) => void submit(event)}
        onChange={() => {
          requestId.current = crypto.randomUUID();
        }}
      >
        <fieldset disabled={busy} className="group-fieldset">
          <label>
            Tên hoạt động
            <input
              name="title"
              required
              maxLength={200}
              placeholder="Ví dụ: Thiết kế mô hình tiết kiệm năng lượng"
            />
          </label>
          <label>
            Lớp học
            <input value={classroom.name} readOnly />
          </label>
          <label>
            Yêu cầu hoạt động
            <textarea
              name="instructions"
              rows={5}
              maxLength={20000}
              placeholder="Mục tiêu, nhiệm vụ và tiêu chí sản phẩm…"
            />
          </label>
          <label>
            File yêu cầu Word
            <input name="requirement" type="file" accept=".docx" />
            <small>
              .docx, tối đa 5 MB. Có thể nhập yêu cầu, tải Word hoặc dùng cả
              hai.
            </small>
          </label>
          <div className="form-grid">
            <label>
              Số nhóm
              <input
                name="groupCount"
                type="number"
                min={1}
                max={classroom.studentCount}
                defaultValue={Math.min(4, classroom.studentCount)}
                required
              />
              <small>
                {classroom.studentCount} học sinh; các nhóm được chia cân bằng.
              </small>
            </label>
            <label>
              Hạn nộp
              <input
                name="deadlineAt"
                type="datetime-local"
                defaultValue={localInput(Date.now() + 86400000)}
                required
              />
              <small>Theo múi giờ của thiết bị đang dùng.</small>
            </label>
          </div>
          <p className="subtle-note">
            Thành viên được chọn ngẫu nhiên. Bạn có thể đổi người đại diện sau
            khi tạo.
          </p>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <div className="modal-actions">
            <button className="button outline" type="button" onClick={onClose}>
              Hủy
            </button>
            <button className="button primary">
              {busy ? "Đang tạo…" : "Tạo và chia nhóm"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function Representative({
  activity,
  group,
  onUpdate,
}: {
  activity: GroupActivity;
  group: ActivityGroup;
  onUpdate: () => Promise<void>;
}) {
  const [value, setValue] = useState(group.representativeId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="group-representative"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
          await api(
            `/group-activities/${activity.id}/groups/${group.id}/representative`,
            {
              studentId: value,
              expectedRepresentativeId: group.representativeId,
            },
          );
          await onUpdate();
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Đại diện · Nhóm {group.number}
        <select
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={busy}
        >
          {!group.members.some(
            (member) => member.id === group.representativeId && member.active,
          ) && (
            <option value={group.representativeId} disabled>
              Đại diện đã rời lớp
            </option>
          )}
          {group.members
            .filter((member) => member.active)
            .map((member) => (
              <option value={member.id} key={member.id}>
                {member.name}
              </option>
            ))}
        </select>
      </label>
      <button
        className="button outline"
        disabled={busy || value === group.representativeId}
      >
        Lưu đại diện
      </button>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}

function ExtendActivity({
  activity,
  onClose,
  onUpdated,
}: {
  activity: GroupActivity;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal title="Gia hạn nộp bài" onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setBusy(true);
          setError("");
          try {
            await api(`/group-activities/${activity.id}/deadline`, {
              deadlineAt: new Date(String(data.get("deadlineAt"))).getTime(),
              expectedDeadlineAt: activity.deadlineAt,
              reason: data.get("reason"),
            });
            await onUpdated();
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy} className="group-fieldset">
          <p>
            Hạn hiện tại: <strong>{date(activity.deadlineAt)}</strong>
          </p>
          <label>
            Hạn nộp mới
            <input
              name="deadlineAt"
              type="datetime-local"
              defaultValue={localInput(
                Math.max(activity.deadlineAt, activity.serverNow) + 86400000,
              )}
              required
            />
            <small>
              Hạn mới phải muộn hơn hạn hiện tại và thời gian bây giờ.
            </small>
          </label>
          <label>
            Lý do gia hạn
            <textarea name="reason" rows={3} maxLength={1000} />
          </label>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="button outline" onClick={onClose}>
              Hủy
            </button>
            <button className="button primary">
              {busy ? "Đang lưu…" : "Lưu hạn mới"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function SubmissionForm({
  activity,
  group,
  onUpdate,
  onRefresh,
}: {
  activity: GroupActivity;
  group: ActivityGroup;
  onUpdate: () => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [kind, setKind] = useState("file");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    const file = data.get("product") as File | null;
    if (file && file.size > 10 * 1024 * 1024) {
      setError("File sản phẩm vượt quá 10 MB.");
      return;
    }
    data.set("requestId", requestId.current);
    setBusy(true);
    try {
      await api(`/group-activities/${activity.id}/submissions`, data);
      form.reset();
      requestId.current = crypto.randomUUID();
      await onUpdate();
    } catch (e) {
      setError(errorMessage(e));
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="group-submit-form"
      onSubmit={(event) => void submit(event)}
      onChange={() => {
        requestId.current = crypto.randomUUID();
      }}
    >
      <fieldset disabled={busy} className="group-fieldset">
        <h3>
          {group.submissions.length ? "Nộp phiên bản mới" : "Nộp sản phẩm nhóm"}
        </h3>
        <label>
          Hình thức nộp
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="file">File Word / PDF / PowerPoint</option>
            <option value="link">Link Canva hoặc sản phẩm trực tuyến</option>
          </select>
        </label>
        {kind === "file" ? (
          <label>
            File sản phẩm
            <input
              name="product"
              type="file"
              accept=".doc,.docx,.pdf,.ppt,.pptx"
              required
            />
            <small>Tối đa 10 MB.</small>
          </label>
        ) : (
          <label>
            Link sản phẩm
            <input
              name="link"
              type="url"
              required
              maxLength={2000}
              placeholder="https://www.canva.com/…"
            />
            <small>Bật quyền xem cho người có link trước khi nộp.</small>
          </label>
        )}
        <label>
          Ghi chú
          <textarea name="note" rows={2} maxLength={3000} />
        </label>
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
        <p className="subtle-note">
          Mỗi lần nộp được lưu riêng. Nhóm có thể nộp lại trước hạn.
        </p>
        <button className="button primary">
          {busy ? "Đang nộp…" : "Nộp bài nhóm"}
        </button>
      </fieldset>
    </form>
  );
}
