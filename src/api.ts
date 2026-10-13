export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const multipart = body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined || multipart
        ? undefined
        : { "Content-Type": "application/json" },
    credentials: "same-origin",
    body:
      body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(
      response.status,
      data.error ?? "Không thể kết nối hệ thống.",
    );
  }
  return data as T;
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Có lỗi xảy ra. Vui lòng thử lại.";
export const duration = (seconds: number) =>
  seconds >= 3600
    ? `${Math.floor(seconds / 3600)} giờ ${Math.floor((seconds % 3600) / 60)} phút`
    : `${Math.floor(seconds / 60)} phút`;

export async function ensureQuestionTypes(questions: { kind?: string }[]) {
  if (!questions.some((q) => q.kind && q.kind !== "multiple-choice")) return;
  const health = await api<{ questionTypes?: boolean }>("/health");
  if (!health.questionTypes)
    throw new Error(
      "Máy chủ chưa hỗ trợ câu Đúng/sai và trả lời ngắn. Cần cập nhật máy chủ trước khi lưu bộ câu này.",
    );
}
