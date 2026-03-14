import { accessSync } from 'node:fs';

/** Returns true if the filesystem at `dir` is case-sensitive. */
export function isCaseSensitiveFS(dir: string): boolean {
  try {
    accessSync(dir.toUpperCase());
    return false;
  } catch {
    return true;
  }
}
