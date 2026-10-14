import { useEffect, useState } from "react";
import { Motto } from "./components";
import {
  Bird,
  BookOpen,
  Compass,
  Flower2,
  Leaf,
  Lightbulb,
  Pause,
  Play,
  Sun,
} from "./icons";

const notes = [
  {
    title: "Mỗi ngày, một chút xanh",
    text: "Không cần đi thật nhanh. Cứ tiếp tục lớn lên.",
    icon: Leaf,
    art: "fox",
  },
  {
    title: "Mở sách, mở một khu rừng",
    text: "Mỗi trang sách mở một lối đi mới.",
    icon: BookOpen,
    art: "owl",
  },
  {
    title: "Tò mò là một siêu năng lực",
    text: "Một câu hỏi nhỏ mở ra cả bầu trời.",
    icon: Lightbulb,
    art: "firefly",
  },
  {
    title: "Chậm thôi, vẫn tiến tới",
    text: "Từng bước nhỏ đưa bạn đi xa.",
    icon: Compass,
    art: "turtle",
  },
  {
    title: "Sai một chút, hiểu thêm chút",
    text: "Lỗi sai chỉ đường cho lần thử tiếp theo.",
    icon: Leaf,
    art: "hedgehog",
  },
  {
    title: "Gom từng hạt hiểu biết",
    text: "Điều mới hôm nay, kho báu ngày mai.",
    icon: BookOpen,
    art: "squirrel",
  },
  {
    title: "Nắng nhỏ cho ngày mới",
    text: "Thử bài vừa sức, khởi động thật vui.",
    icon: Sun,
    art: "rabbit",
  },
  {
    title: "Học cùng nhau, vui hơn",
    text: "Chia sẻ điều hay, cả khu rừng cùng lớn.",
    icon: Bird,
    art: "bear",
  },
  {
    title: "Cho ý tưởng được nở hoa",
    text: "Cứ thử cách của bạn. Điều hay từ tò mò.",
    icon: Flower2,
    art: "fox",
  },
  {
    title: "Cú nhỏ đang chờ nghe",
    text: "Kể điều vừa học bằng lời của mình.",
    icon: BookOpen,
    art: "owl",
  },
  {
    title: "Thắp sáng một điều mới",
    text: "Hiểu thêm một chút, ngày sáng hơn.",
    icon: Lightbulb,
    art: "firefly",
  },
  {
    title: "Bền bỉ như rùa nhỏ",
    text: "Hôm nay thử tốt hơn hôm qua.",
    icon: Compass,
    art: "turtle",
  },
  {
    title: "Nhím nhỏ cũng biết nghỉ",
    text: "Thả lỏng vai, thở sâu rồi học tiếp.",
    icon: Sun,
    art: "hedgehog",
  },
  {
    title: "Kho báu nằm trong câu hỏi",
    text: "Chưa hiểu thì hỏi. Sóc cũng học bằng tò mò.",
    icon: Lightbulb,
    art: "squirrel",
  },
  {
    title: "Chăm điều nhỏ, đón điều hay",
    text: "Chút tập trung nuôi một ý tưởng lớn.",
    icon: Flower2,
    art: "rabbit",
  },
  {
    title: "Bạn đã cố gắng hôm nay",
    text: "Gấu nhỏ gửi một cái ôm. Mình tiếp tục nhé.",
    icon: Bird,
    art: "bear",
  },
] as const;

type NoteArt = (typeof notes)[number]["art"];

function Face({ x, y }: { x: number; y: number }) {
  return (
    <g fill="#3e4936" stroke="#3e4936" strokeLinecap="round">
      <circle cx={x - 7} cy={y} r="1.6" stroke="none" />
      <circle cx={x + 7} cy={y} r="1.6" stroke="none" />
      <path d={`M${x - 3} ${y + 6}q3 3 6 0`} fill="none" strokeWidth="1.5" />
      <ellipse
        cx={x - 12}
        cy={y + 4}
        rx="3"
        ry="1.7"
        fill="#e7ab91"
        stroke="none"
      />
      <ellipse
        cx={x + 12}
        cy={y + 4}
        rx="3"
        ry="1.7"
        fill="#e7ab91"
        stroke="none"
      />
    </g>
  );
}

function OpenBook() {
  return (
    <g stroke="#739b70" strokeWidth="1.5" strokeLinejoin="round">
      <path
        d="M30 57q14-7 29 1 15-8 29-1v21q-15-6-29 0-15-6-29 0Z"
        fill="#fff8de"
      />
      <path
        d="M59 58v20M36 63l16 2m-16 4 16 2m14-6 15-2m-15 8 15-2"
        fill="none"
      />
    </g>
  );
}

function NoteIllustration({ art }: { art: NoteArt }) {
  if (art === "fox")
    return (
      <img
        className="sidebar-note-art"
        data-art={art}
        src="/assets/garden-note-friends.svg"
        alt=""
        width={120}
        height={88}
        aria-hidden="true"
      />
    );
  return (
    <svg
      className="sidebar-note-art"
      data-art={art}
      viewBox="0 0 120 88"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="60" cy="80" rx="43" ry="4" fill="#356748" opacity=".1" />
      {art === "owl" && (
        <>
          <path
            d="m35 29-3-15 17 7m23 0 17-7-3 17"
            fill="#b98b65"
            stroke="#8c694e"
            strokeWidth="1.5"
          />
          <ellipse
            cx="60"
            cy="46"
            rx="29"
            ry="30"
            fill="#c5a27b"
            stroke="#8c694e"
            strokeWidth="1.5"
          />
          <ellipse cx="48" cy="38" rx="13" ry="16" fill="#fff3d7" />
          <ellipse cx="72" cy="38" rx="13" ry="16" fill="#fff3d7" />
          <circle cx="48" cy="38" r="4" fill="#3e4936" />
          <circle cx="72" cy="38" r="4" fill="#3e4936" />
          <circle cx="49" cy="37" r="1.3" fill="white" />
          <circle cx="73" cy="37" r="1.3" fill="white" />
          <path d="m55 45 5 7 5-7" fill="#dba351" />
          <OpenBook />
          <path
            d="M31 50q-9 8 1 17m57-17q9 8-1 17"
            stroke="#8c694e"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="m100 20 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#dab855" />
        </>
      )}
      {art === "rabbit" && (
        <>
          <ellipse
            cx="57"
            cy="21"
            rx="7"
            ry="17"
            transform="rotate(-13 57 21)"
            fill="#f4eadb"
            stroke="#ac9780"
            strokeWidth="1.5"
          />
          <ellipse
            cx="75"
            cy="22"
            rx="7"
            ry="17"
            transform="rotate(13 75 22)"
            fill="#f4eadb"
            stroke="#ac9780"
            strokeWidth="1.5"
          />
          <path
            d="m56 13 3 15m16-15-3 15"
            stroke="#e8bcb3"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse
            cx="65"
            cy="63"
            rx="19"
            ry="16"
            fill="#f4eadb"
            stroke="#ac9780"
            strokeWidth="1.5"
          />
          <ellipse
            cx="65"
            cy="43"
            rx="22"
            ry="19"
            fill="#f4eadb"
            stroke="#ac9780"
            strokeWidth="1.5"
          />
          <Face x={65} y={40} />
          <path
            d="M31 68h25v10H31Zm4-2q-4-12 7-10h10v12m3-7 16-6-3 10-13 6"
            fill="#8ab4ad"
            stroke="#577f78"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="m73 63 10 6m-7-2 7 7"
            stroke="#89b8d0"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M94 73V53m0 8-8-5m8 2 8-9"
            stroke="#658c54"
            strokeWidth="2"
          />
          <circle cx="95" cy="46" r="7" fill="#e7b5b0" />
          <circle cx="95" cy="46" r="2" fill="#e7c563" />
        </>
      )}
      {art === "hedgehog" && (
        <>
          <path
            d="m24 66-6-8 9-5-4-10 12-2 1-12 12 4 7-11 9 8 12-6 5 12 13 2-3 12 8 8-10 8Z"
            fill="#a68669"
            stroke="#86684d"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <ellipse
            cx="59"
            cy="58"
            rx="28"
            ry="19"
            fill="#f0d8b1"
            stroke="#ad8a62"
            strokeWidth="1.5"
          />
          <Face x={65} y={55} />
          <path
            d="M44 75v3m25-3v3"
            stroke="#86684d"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M18 77V64h10v13"
            fill="#f5e5c9"
            stroke="#ad8a62"
            strokeWidth="1.5"
          />
          <path
            d="M9 65q2-21 15-20 12 1 15 20Z"
            fill="#cd8171"
            stroke="#a96054"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="54" r="3" fill="#fff3d7" />
          <circle cx="30" cy="59" r="2" fill="#fff3d7" />
          <path d="M99 38q7-12 13-5-4 8-13 5Z" fill="#8bac67" />
        </>
      )}
      {art === "turtle" && (
        <>
          <path
            d="M30 68v8m31-8v8m16-8v8"
            stroke="#85a870"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M20 67q-1-36 32-36 32 0 32 36Z"
            fill="#80a978"
            stroke="#547a54"
            strokeWidth="1.5"
          />
          <path
            d="m41 38-8 16 10 14h19l10-14-10-16Zm-8 16H21m51 0h10m-30 14v-9"
            stroke="#547a54"
            strokeWidth="1.5"
          />
          <ellipse
            cx="89"
            cy="61"
            rx="17"
            ry="15"
            fill="#b6cf95"
            stroke="#789762"
            strokeWidth="1.5"
          />
          <Face x={90} y={58} />
          <rect
            x="36"
            y="18"
            width="32"
            height="17"
            rx="5"
            fill="#dba874"
            stroke="#a57b52"
            strokeWidth="1.5"
          />
          <path
            d="M44 18v17m16-17v17m-11-17v-4h8v4"
            stroke="#a57b52"
            strokeWidth="2"
          />
          <path
            d="M17 25q-8-6-9 2m9-2q3-9 7-6"
            stroke="#8bb498"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {art === "squirrel" && (
        <>
          <path
            d="M51 74C7 90 4 51 15 32c11-20 34-8 27 4-5 9-14 5-13 17 0 11 12 10 22 10Z"
            fill="#d7a16a"
            stroke="#a97548"
            strokeWidth="1.5"
          />
          <ellipse
            cx="69"
            cy="64"
            rx="20"
            ry="17"
            fill="#d7a16a"
            stroke="#a97548"
            strokeWidth="1.5"
          />
          <path
            d="m52 30 2-16 12 9m11-2 13-8-1 18"
            fill="#d7a16a"
            stroke="#a97548"
            strokeWidth="1.5"
          />
          <ellipse
            cx="72"
            cy="39"
            rx="22"
            ry="18"
            fill="#d7a16a"
            stroke="#a97548"
            strokeWidth="1.5"
          />
          <Face x={74} y={36} />
          <ellipse cx="72" cy="62" rx="11" ry="15" fill="#fff0d6" />
          <path
            d="M67 56q-10 23 6 21 15-1 6-21"
            fill="#bd8954"
            stroke="#8e6843"
            strokeWidth="1.5"
          />
          <path d="M61 56q11-12 24 0l-2 5H64Z" fill="#8f7350" />
          <path
            d="M73 48v-5"
            stroke="#8f7350"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="m52 60 11 3m22-3-5 3"
            stroke="#a97548"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
      {art === "bear" && (
        <>
          <circle
            cx="40"
            cy="23"
            r="10"
            fill="#b9936e"
            stroke="#896b50"
            strokeWidth="1.5"
          />
          <circle
            cx="79"
            cy="23"
            r="10"
            fill="#b9936e"
            stroke="#896b50"
            strokeWidth="1.5"
          />
          <circle cx="40" cy="23" r="5" fill="#e7c4a2" />
          <circle cx="79" cy="23" r="5" fill="#e7c4a2" />
          <ellipse
            cx="60"
            cy="61"
            rx="24"
            ry="20"
            fill="#b9936e"
            stroke="#896b50"
            strokeWidth="1.5"
          />
          <ellipse
            cx="60"
            cy="36"
            rx="26"
            ry="23"
            fill="#b9936e"
            stroke="#896b50"
            strokeWidth="1.5"
          />
          <ellipse cx="60" cy="43" rx="12" ry="9" fill="#f2ddbd" />
          <Face x={60} y={34} />
          <OpenBook />
          <path
            d="M34 56q-8 5 0 12m52-12q8 5 0 12"
            stroke="#896b50"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M99 26c-10-9-16 6 0 15 16-9 10-24 0-15Z" fill="#d9968d" />
        </>
      )}
      {art === "firefly" && (
        <>
          <circle cx="63" cy="63" r="23" fill="#f5dfa0" opacity=".4" />
          <ellipse
            cx="44"
            cy="46"
            rx="13"
            ry="22"
            transform="rotate(-35 44 46)"
            fill="#c0ddd1"
            stroke="#7cab97"
            strokeWidth="1.5"
          />
          <ellipse
            cx="79"
            cy="46"
            rx="13"
            ry="22"
            transform="rotate(35 79 46)"
            fill="#c0ddd1"
            stroke="#7cab97"
            strokeWidth="1.5"
          />
          <ellipse
            cx="62"
            cy="59"
            rx="14"
            ry="20"
            fill="#eed28a"
            stroke="#bca15c"
            strokeWidth="1.5"
          />
          <path d="M50 54h24m-25 8h26" stroke="#bca15c" strokeWidth="2" />
          <path
            d="M55 26q-8-13-12-9m24 9q8-13 12-9"
            stroke="#65856c"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="62"
            cy="34"
            r="18"
            fill="#a8c7a0"
            stroke="#65856c"
            strokeWidth="1.5"
          />
          <Face x={62} y={31} />
          <path
            d="m19 35 2 4 4 2-4 2-2 4-2-4-4-2 4-2Zm82 22 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z"
            fill="#d5b550"
          />
        </>
      )}
    </svg>
  );
}

export function GardenNote({ isTeacher }: { isTeacher: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (paused || hovered || focused || !visible) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % notes.length),
      10_000,
    );
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, visible]);
  const note = notes[index];
  const Icon = note.icon;
  return (
    <div
      className="sidebar-note garden-note"
      aria-label="Lời nhắn khu rừng tri thức"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <div className="garden-note-content" key={index}>
        <span className="note-leaf">
          <Icon size={19} aria-hidden="true" />
        </span>
        <strong>
          <Motto>{note.title}</Motto>
        </strong>
        <p>
          <Motto>
            {index === 0 && isTeacher
              ? "Cùng học sinh gieo mầm tri thức."
              : note.text}
          </Motto>
        </p>
        <NoteIllustration art={note.art} />
      </div>
      <button
        type="button"
        className="garden-note-pause"
        aria-label="Tạm dừng lời nhắn"
        aria-pressed={paused}
        title={
          paused ? "Tiếp tục đổi lời nhắn mỗi 10 giây" : "Tạm dừng đổi lời nhắn"
        }
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? (
          <Play size={13} aria-hidden="true" />
        ) : (
          <Pause size={13} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
