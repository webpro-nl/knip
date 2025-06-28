type Collection<T> = Array<T> | Set<T>;

/** Remove duplicates and falsy values from arrays and sets */
export const compact = <T>(collection: Collection<T | undefined>) =>
  Array.from(new Set(collection)).filter((value): value is T => Boolean(value));

export const arrayify = (value?: string[] | string) =>
  Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];

export const partition = <T>(collection: T[], predicate: (item: T) => unknown) => {
  const results: [T[], T[]] = [[], []];
  for (const item of collection) results[predicate(item) ? 0 : 1].push(item);
  return results;
};
