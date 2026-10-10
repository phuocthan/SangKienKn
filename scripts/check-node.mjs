import { isBuiltin } from "node:module";

const major = Number(process.versions.node.split(".")[0]);
if (major < 24 || !isBuiltin("node:sqlite")) {
  console.error(
    [
      `GreenEdu cần Node.js 24 trở lên với node:sqlite. Đang chạy ${process.version}.`,
      `Node hiện tại: ${process.execPath}`,
      "Cài Node.js 24 tại https://nodejs.org/en/download, rồi đóng và mở lại PowerShell/terminal.",
      "Kiểm tra bằng: node -v. Trên Windows, dùng where.exe node nếu vẫn thấy phiên bản cũ.",
      "Sau đó chạy: npm ci, npm run build, npm run demo.",
    ].join("\n"),
  );
  process.exit(1);
}
