import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare } from "./icons";
import { api, errorMessage } from "./api";
import { Modal } from "./components";
import { MessageComposer, conversationDate } from "./Conversation";
import type {
  GroupActivity,
  ActivityGroup,
  GroupDiscussionPost,
} from "../shared/group-activities";
import type { User } from "./types";

export function GroupDiscussion({
  activity,
  group,
  user,
}: {
  activity: GroupActivity;
  group: ActivityGroup;
  user: User;
}) {
  const [opened, setOpened] = useState(false);
  const close = useCallback(() => setOpened(false), []);
  return (
    <>
      <button
        className="button outline small discussion-button"
        onClick={() => setOpened(true)}
      >
        <MessageSquare size={16} />
        Trao đổi & phản biện
      </button>
      {opened && (
        <DiscussionDialog
          activity={activity}
          group={group}
          user={user}
          onClose={close}
        />
      )}
    </>
  );
}
function DiscussionDialog({
  activity,
  group,
  user,
  onClose,
}: {
  activity: GroupActivity;
  group: ActivityGroup;
  user: User;
  onClose: () => void;
}) {
  const [posts, setPosts] = useState<GroupDiscussionPost[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [kind, setKind] = useState("question");
  const teacher = user.role === "teacher";
  const own = activity.myGroupId === group.id;
  const endpoint = `/group-activities/${activity.id}/groups/${group.id}/discussion`;
  const sequence = useRef(0);
  useEffect(() => {
    let alive = true;
    const reload = async () => {
      const ticket = ++sequence.current;
      try {
        const data = await api<{ posts: GroupDiscussionPost[] }>(endpoint);
        if (alive && ticket === sequence.current) {
          setPosts(data.posts);
          setError("");
        }
      } catch (e) {
        if (alive && ticket === sequence.current) setError(errorMessage(e));
      } finally {
        if (alive && ticket === sequence.current) setLoading(false);
      }
    };
    void reload();
    const update = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void reload();
    };
    const poll = setInterval(update, 20000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    return () => {
      alive = false;
      sequence.current++;
      clearInterval(poll);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
    };
  }, [endpoint]);
  async function send(body: string, requestId: string, parentId?: string) {
    const data = await api<{ posts: GroupDiscussionPost[] }>(endpoint, {
      body,
      requestId,
      parentId,
      kind,
    });
    sequence.current++;
    setPosts(data.posts);
    setError("");
  }
  async function reload() {
    const ticket = ++sequence.current;
    try {
      const data = await api<{ posts: GroupDiscussionPost[] }>(endpoint);
      if (ticket === sequence.current) {
        setPosts(data.posts);
        setError("");
      }
    } catch (e) {
      if (ticket === sequence.current) setError(errorMessage(e));
    }
  }
  function message(post: GroupDiscussionPost) {
    return (
      <article className={`conversation-message ${post.kind}`} key={post.id}>
        <strong>
          {post.authorName} ·{" "}
          {post.authorRole === "teacher"
            ? "Giáo viên"
            : `Nhóm ${post.authorGroupNumber}`}
        </strong>
        <small>
          {post.kind === "question"
            ? "Câu hỏi"
            : post.kind === "comment"
              ? "Góp ý"
              : "Phản biện"}{" "}
          · {conversationDate(post.createdAt)} · Sản phẩm lần{" "}
          {post.submissionVersion}
        </small>
        <p>{post.body}</p>
      </article>
    );
  }
  return (
    <Modal
      title={`Trao đổi & phản biện · Nhóm ${group.number}`}
      onClose={onClose}
      className="discussion-dialog"
    >
      <div className="conversation-heading">
        <p>
          Đọc sản phẩm của nhóm, trao đổi rõ ràng và tôn trọng nhau. Thành viên
          nhóm phụ trách trả lời dưới từng câu hỏi hoặc ý kiến.
        </p>
      </div>
      {error && (
        <p className="error-banner" role="alert">
          {error}
          <button type="button" onClick={() => void reload()}>
            Thử lại
          </button>
        </p>
      )}
      {loading ? (
        <p role="status">Đang tải trao đổi…</p>
      ) : (
        <>
          {!posts.length && (
            <p className="subtle-note">
              Chưa có câu hỏi hoặc góp ý cho sản phẩm này.
            </p>
          )}
          {posts
            .filter((post) => !post.parentId)
            .map((post) => (
              <section className="discussion-thread" key={post.id}>
                {message(post)}
                <div className="discussion-replies">
                  {posts
                    .filter((reply) => reply.parentId === post.id)
                    .map(message)}
                </div>
                {!user.readOnly && (own || teacher) && (
                  <MessageComposer
                    label={`Phản biện ý kiến của ${post.authorName}`}
                    submitLabel="Gửi phản biện"
                    onSend={(body, requestId) => send(body, requestId, post.id)}
                  />
                )}
              </section>
            ))}
          {!user.readOnly && ((!own && activity.myGroupId) || teacher) ? (
            <div className="discussion-new">
              <h3>Gửi trao đổi cho nhóm</h3>
              <label>
                Loại trao đổi
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="question">Câu hỏi</option>
                  <option value="comment">Góp ý</option>
                </select>
              </label>
              <MessageComposer
                key={kind}
                label="Nội dung trao đổi"
                submitLabel="Gửi trao đổi"
                onSend={send}
              />
            </div>
          ) : (
            <p className="subtle-note">
              {own
                ? "Nhóm bạn có thể phản biện bên dưới từng câu hỏi và ý kiến nhận được."
                : "Bạn cần được phân nhóm để tham gia trao đổi."}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
