export const compact = <T>(collection: (T | undefined)[]) =>
  Array.from(new Set(collection)).filter((value): value is T => Boolean(value));

export const arrayify = (value?: string[] | string) =>
  Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];

export const partition = <T>(values: T[] | Set<T>, predicate: (value: T) => boolean) => {
  const results: [T[], T[]] = [[], []];

  values.forEach(value => {
    results[predicate(value) ? 0 : 1].push(value);
  });

  return results;
};
