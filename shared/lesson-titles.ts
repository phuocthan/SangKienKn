// Only numbered lessons tolerate punctuation and Vietnamese tone placement variants.
export function lessonTitleKey(title: string) {
  const clean = title
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi");
  const plain = clean
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
  const numbered = /^bai\s*(\d+)\s*[:.·–—-]*\s*(.+)$/u.exec(plain);
  return numbered ? `bai ${Number(numbered[1])} ${numbered[2]}` : clean;
}

export function matchingLessonTitle(title: string, titles: string[]) {
  if (titles.includes(title)) return title;
  const matches = [
    ...new Set(
      titles.filter((value) => lessonTitleKey(value) === lessonTitleKey(title)),
    ),
  ];
  if (matches.length > 1)
    throw new Error(
      "Có nhiều bài có tên tương đương. Hãy chọn chính xác bài nhận câu hỏi.",
    );
  return matches[0] ?? title;
}
