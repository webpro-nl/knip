import fs from 'node:fs';
import { isFile } from './fs.ts';

const dirMtimes = new Map<string, number>();
const existingFiles = new Map<string, boolean>();

export const clearFsCache = () => {
  dirMtimes.clear();
  existingFiles.clear();
};

export const statDirMtime = (dir: string): number => {
  let mtime = dirMtimes.get(dir);
  if (mtime === undefined) {
    try {
      const stat = fs.statSync(dir, { throwIfNoEntry: false });
      mtime = stat?.isDirectory() ? stat.mtimeMs : Number.NaN;
    } catch {
      mtime = Number.NaN;
    }
    dirMtimes.set(dir, mtime);
  }
  return mtime;
};

export const isExistingFile = (filePath: string): boolean => {
  let exists = existingFiles.get(filePath);
  if (exists === undefined) {
    exists = isFile(filePath);
    existingFiles.set(filePath, exists);
  }
  return exists;
};
