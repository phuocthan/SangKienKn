export const AVATAR_COLLECTIONS = {
  teacher: {
    name: "Chibi giáo viên",
    image: "/assets/avatars-teachers-v1.png",
    rows: 4,
  },
  student: {
    name: "Chibi học sinh",
    image: "/assets/avatars-students-v1.png",
    rows: 2,
  },
  nature: {
    name: "Mầm, chồi & cây",
    image: "/assets/avatars-nature-v1.png",
    rows: 4,
  },
};
export type AvatarCollection = keyof typeof AVATAR_COLLECTIONS;
export function avatarCollectionsFor(
  role: string,
): readonly AvatarCollection[] {
  return role === "student"
    ? ["student", "nature"]
    : ["teacher", "nature", "student"];
}
export const AVATAR_UPLOAD_LIMIT = 3 * 1024 * 1024;
export const AVATAR_MAX_DIMENSION = 4096;
export const isUploadedAvatar = (id: unknown): id is string =>
  typeof id === "string" &&
  /^upload-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(id);
export type AvatarOption = {
  id: string;
  name: string;
  collection: AvatarCollection;
  tile: number;
};

const teachers = [
  "Cô giáo áo dài",
  "Thầy giáo cùng sách",
  "Cô giáo Toán",
  "Thầy giáo Toán",
  "Cô giáo Hóa học",
  "Thầy giáo Vật lý",
  "Cô giáo Ngữ văn",
  "Thầy giáo Lịch sử",
  "Cô giáo Ngoại ngữ",
  "Thầy giáo Tin học",
  "Cô giáo Âm nhạc",
  "Thầy giáo Mỹ thuật",
  "Cô giáo Tiểu học",
  "Thầy giáo Thể dục",
  "Cô giáo gieo mầm",
  "Thầy giáo chủ nhiệm",
];
const students = [
  "Bạn nữ yêu sách",
  "Bạn nam yêu sách",
  "Bạn nữ khám phá",
  "Bạn nam khoa học",
  "Bạn nữ sáng tạo",
  "Bạn nam âm nhạc",
  "Bạn nữ chăm cây",
  "Bạn nam thể thao",
];
const nature = [
  "Hạt mầm tí hon",
  "Mầm xanh hai lá",
  "Chồi non tinh nghịch",
  "Búp lá dịu dàng",
  "Lá tim yêu thương",
  "Lá phong vui vẻ",
  "Lá trầu bà",
  "Chồi tre nhỏ",
  "Chậu cây bé xinh",
  "Bụi cây bồng bềnh",
  "Cây non chăm chỉ",
  "Cây xanh bảo vệ",
  "Cây hoa mùa xuân",
  "Hướng dương rạng rỡ",
  "Sen đá đáng yêu",
  "Hạt sồi nảy mầm",
];
export const AVATARS: AvatarOption[] = [
  ...teachers.map((name, tile) => ({
    id: `teacher-${tile + 1}`,
    name,
    tile,
    collection: "teacher" as const,
  })),
  ...students.map((name, tile) => ({
    id: `student-${tile + 1}`,
    name,
    tile,
    collection: "student" as const,
  })),
  ...nature.map((name, tile) => ({
    id: `nature-${tile + 1}`,
    name,
    tile,
    collection: "nature" as const,
  })),
];
export function findAvatar(id: unknown) {
  return typeof id === "string"
    ? AVATARS.find((avatar) => avatar.id === id)
    : undefined;
}
