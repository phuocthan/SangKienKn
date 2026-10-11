import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Sprout,
  Monitor,
  Smartphone,
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Download,
} from "lucide-react";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./studio.css";

const defaults = {
  theme: "garden",
  radius: 24,
  density: "comfortable",
  school: true,
};
function saved() {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem("greenedu-garden-preview") || "{}"),
    };
  } catch {
    return defaults;
  }
}
function Studio() {
  const [prefs, setPrefs] = useState(saved);
  const [role, setRole] = useState("student");
  const [device, setDevice] = useState("desktop");
  const [custom, setCustom] = useState(false);
  const [notice, setNotice] = useState("");
  const [note, setNote] = useState("");
  const frame = React.useRef(null);
  React.useEffect(() => {
    const ready = (e) => {
      if (
        e.origin === location.origin &&
        e.source === frame.current?.contentWindow &&
        e.data?.type === "garden-ready"
      )
        sync(prefs);
    };
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, [prefs]);
  function sync(next = prefs) {
    frame.current?.contentWindow?.postMessage(
      { type: "garden-preferences", prefs: next },
      location.origin,
    );
  }
  function change(next) {
    const p = { ...prefs, ...next };
    setPrefs(p);
    sync(p);
  }
  function save() {
    localStorage.setItem("greenedu-garden-preview", JSON.stringify(prefs));
    const blob = new Blob(
      [
        JSON.stringify(
          {
            direction: "Khu vườn ấm áp",
            preferences: prefs,
            feedback: note,
            status: "preview-only",
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "greenedu-lua-chon-thiet-ke.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setNotice(
      "Đã lưu lựa chọn cho bản xem trước. Giao diện chính chưa thay đổi.",
    );
  }
  return (
    <div className="studio">
      <header className="studio-bar">
        <div className="studio-brand">
          <span className="studio-logo">
            <Sprout size={21} />
          </span>
          <div>
            <strong>
              GreenEdu <span>· Khu vườn ấm áp</span>
            </strong>
            <small>Bản xem trước tương tác · Dữ liệu minh họa</small>
          </div>
        </div>
        <div className="studio-tools">
          <label className="role-label">
            <span>Màn hình</span>
            <select
              aria-label="Chọn vai trò preview"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
              <option value="admin">Quản trị</option>
              <option value="login">Đăng nhập</option>
            </select>
          </label>
          <div className="device-buttons" aria-label="Kích thước xem trước">
            <button
              title="Máy tính"
              aria-label="Máy tính"
              aria-pressed={device === "desktop"}
              onClick={() => setDevice("desktop")}
            >
              <Monitor size={18} />
            </button>
            <button
              title="Điện thoại"
              aria-label="Điện thoại"
              aria-pressed={device === "mobile"}
              onClick={() => setDevice("mobile")}
            >
              <Smartphone size={18} />
            </button>
          </div>
          <button
            className="studio-button"
            aria-expanded={custom}
            onClick={() => setCustom(!custom)}
          >
            <SlidersHorizontal size={17} />
            Tùy chỉnh
          </button>
        </div>
      </header>
      <div className={`preview-stage ${device}`}>
        <iframe
          ref={frame}
          key={role}
          title="Giao diện GreenEdu mới"
          src={`/canvas.html?role=${role}`}
          onLoad={() => sync()}
        />
      </div>
      {custom && (
        <>
          <button
            className="drawer-shade"
            aria-label="Đóng tùy chỉnh"
            onClick={() => setCustom(false)}
          />
          <aside className="design-drawer" aria-label="Tùy chỉnh thiết kế">
            <div className="drawer-heading">
              <div>
                <small>BIẾN KHU VƯỜN THÀNH CỦA BẠN</small>
                <h2>Tinh chỉnh giao diện</h2>
              </div>
              <button
                className="plain-icon"
                aria-label="Đóng"
                onClick={() => setCustom(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p>Thay đổi được hiển thị ngay trong preview để bạn so sánh.</p>
            <fieldset>
              <legend>Bảng màu</legend>
              <button
                className={`theme-option ${prefs.theme === "garden" ? "chosen" : ""}`}
                onClick={() => change({ theme: "garden" })}
              >
                <span className="swatches">
                  <i style={{ background: "#365b3d" }} />
                  <i style={{ background: "#e5eddc" }} />
                  <i style={{ background: "#f6eddc" }} />
                </span>
                <span>
                  <strong>Vườn xanh</strong>
                  <small>Xanh lá dịu và nền kem</small>
                </span>
                {prefs.theme === "garden" && <Check size={17} />}
              </button>
              <button
                className={`theme-option ${prefs.theme === "sunny" ? "chosen" : ""}`}
                onClick={() => change({ theme: "sunny" })}
              >
                <span className="swatches">
                  <i style={{ background: "#627044" }} />
                  <i style={{ background: "#f1e7c6" }} />
                  <i style={{ background: "#c98c60" }} />
                </span>
                <span>
                  <strong>Vườn nắng</strong>
                  <small>Xanh ô liu và vàng đất</small>
                </span>
                {prefs.theme === "sunny" && <Check size={17} />}
              </button>
            </fieldset>
            <label className="setting">
              Độ bo góc <output>{prefs.radius} px</output>
              <input
                aria-label="Độ bo góc"
                type="range"
                min="12"
                max="32"
                step="2"
                value={prefs.radius}
                onChange={(e) => change({ radius: Number(e.target.value) })}
              />
            </label>
            <fieldset>
              <legend>Khoảng cách nội dung</legend>
              <div className="setting-segment">
                <button
                  className={prefs.density === "comfortable" ? "chosen" : ""}
                  onClick={() => change({ density: "comfortable" })}
                >
                  Thoáng, dễ đọc
                </button>
                <button
                  className={prefs.density === "compact" ? "chosen" : ""}
                  onClick={() => change({ density: "compact" })}
                >
                  Gọn hơn
                </button>
              </div>
            </fieldset>
            <label className="toggle-setting">
              <span>
                <strong>Ảnh trường ở nền</strong>
                <small>Chỉ hiện rất nhẹ sau nội dung</small>
              </span>
              <input
                type="checkbox"
                checked={prefs.school}
                onChange={(e) => change({ school: e.target.checked })}
              />
            </label>
            <label className="setting">
              Bạn muốn chỉnh thêm điều gì?
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: nút lớn hơn, nền ấm hơn, khung bớt bo..."
                rows="3"
              />
            </label>
            <button className="studio-button full" onClick={save}>
              <Download size={17} />
              Lưu lựa chọn & góp ý
            </button>
            <button
              className="reset-button"
              onClick={() => {
                setPrefs(defaults);
                sync(defaults);
              }}
            >
              <RotateCcw size={15} />
              Về thiết kế đề xuất
            </button>
            <p className="drawer-footnote">
              Lựa chọn chỉ áp dụng cho preview. Bạn duyệt trong chat trước khi
              tôi đưa thiết kế vào dự án.
            </p>
          </aside>
        </>
      )}
      {notice && (
        <div className="studio-notice" role="status">
          <Check size={18} />
          {notice}
          <button aria-label="Đóng thông báo" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<Studio />);
