type TopicScope = { chapterId?: string; lesson?: string; topic?: string };

/** Balance topic coverage without replacing questions or changing lesson quotas. */
export function sampleByTopic<T>(
  values: readonly T[],
  count: number,
  scope: (value: T) => TopicScope,
  randomIndex: (upper: number) => number = (upper) =>
    Math.floor(Math.random() * upper),
): T[] {
  const shuffled = [...values];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const limit = Math.max(0, Math.min(values.length, Math.floor(count)));
  if (!values.some((value) => scope(value).topic?.trim()))
    return shuffled.slice(0, limit);
  const groups = new Map<string, { rows: T[]; used: number }>();
  for (const value of shuffled) {
    const row = scope(value);
    const topic = (row.topic ?? "")
      .normalize("NFC")
      .trim()
      .toLocaleLowerCase("vi")
      .replace(/\s+/g, " ");
    const key = JSON.stringify([row.chapterId ?? "", row.lesson ?? "", topic]);
    const group = groups.get(key) ?? { rows: [], used: 0 };
    group.rows.push(value);
    groups.set(key, group);
  }
  const result: T[] = [];
  let previous = "";
  while (result.length < limit) {
    const available = [...groups].filter(([, group]) => group.rows.length);
    // Avoid adjacent repeats whenever another topic remains available.
    const alternatives = available.filter(([key]) => key !== previous);
    const pool = alternatives.length ? alternatives : available;
    const leastUsed = Math.min(...pool.map(([, group]) => group.used));
    const candidates = pool.filter(([, group]) => group.used === leastUsed);
    const [key, group] = candidates[randomIndex(candidates.length)];
    result.push(group.rows.pop()!);
    group.used++;
    previous = key;
  }
  return result;
}
