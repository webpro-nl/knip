export function getStats(values: number[]) {
  if (values.length === 0) return { min: 0, max: 0, sum: 0, median: 0 };

  const sorted = values.toSorted((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return { min, max, sum, median };
}
