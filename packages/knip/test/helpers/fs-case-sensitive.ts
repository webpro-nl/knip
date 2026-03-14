import { accessSync } from 'node:fs';

/** Returns true if the filesystem at `dir` is case-sensitive. */
export function isCaseSensitiveFileSystem(dir: string): boolean {
  // If a directory has all uppercase letters, then we test for case insensitivity by comparing it
  // with the lowercase version. Otherwise, we can compare with the uppercase version.
  const testDir = dir === dir.toUpperCase() ? dir.toLowerCase() : dir.toUpperCase();

  if (testDir === dir) {
    throw new Error(`Cannot determine case sensitivity. The directory path of "${dir}" lacks alphabetic characters.`);
  }

  try {
    accessSync(testDir);
    return false;
  } catch {
    return true;
  }
}
