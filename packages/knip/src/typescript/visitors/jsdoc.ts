import type { Comment } from 'oxc-parser';

export const EMPTY_TAGS: Set<string> = new Set();

export function buildJSDocTagLookup(comments: Comment[], sourceText: string) {
  const entries: { reach: number; tags: Set<string> }[] = [];
  let reach = sourceText.length;

  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i];
    let end = comment.end;
    while (end < sourceText.length) {
      const ch = sourceText.charCodeAt(end);
      if (ch !== 32 && ch !== 9 && ch !== 10 && ch !== 13) break;
      end++;
    }
    if (end !== comments[i + 1]?.start) reach = end;

    const value = comment.value;
    let index = value.indexOf('@');
    if (index === -1) continue;

    if (comment.type === 'Line') {
      let start = comment.start;
      while (start > 0 && (sourceText.charCodeAt(start - 1) === 32 || sourceText.charCodeAt(start - 1) === 9)) start--;
      if (start > 0 && sourceText.charCodeAt(start - 1) !== 10 && sourceText.charCodeAt(start - 1) !== 13) continue;
    }

    let tags: Set<string> | undefined;
    while (index !== -1) {
      let end = index + 1;
      while (
        end < value.length &&
        (((value.charCodeAt(end) | 32) >= 97 && (value.charCodeAt(end) | 32) <= 122) ||
          (value.charCodeAt(end) >= 48 && value.charCodeAt(end) <= 57) ||
          value.charCodeAt(end) === 95)
      )
        end++;
      if (end > index + 1) {
        if (!tags) tags = new Set();
        tags.add(value.slice(index, end));
      }
      index = value.indexOf('@', end);
    }
    if (!tags) continue;

    const entry = entries[entries.length - 1];
    if (entry?.reach === reach) {
      for (const tag of tags) entry.tags.add(tag);
    } else {
      entries.push({ reach, tags });
    }
  }

  if (entries.length === 0) return () => EMPTY_TAGS;
  entries.reverse();

  return function getJSDocTags(nodeStart: number): Set<string> {
    let lo = 0;
    let hi = entries.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const r = entries[mid].reach;
      if (r === nodeStart) return entries[mid].tags;
      if (r < nodeStart) lo = mid + 1;
      else hi = mid - 1;
    }
    return EMPTY_TAGS;
  };
}
