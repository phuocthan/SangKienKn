/** Search Vietnamese names without requiring accents or exact spacing. */
export function searchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("vi")
    .replace(/đ/g, "d")
    .trim()
    .replace(/\s+/g, " ");
}
