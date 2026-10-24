import { statSync } from 'node:fs';

export const fileFingerprint = (filePath: string): string | undefined => {
  try {
    const stat = statSync(filePath, { throwIfNoEntry: false });
    if (stat) return `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`;
  } catch {}
};

export const fingerprintsMatch = (fingerprints: Map<string, string | undefined>) => {
  for (const [filePath, previous] of fingerprints) if (fileFingerprint(filePath) !== previous) return false;
  return true;
};
