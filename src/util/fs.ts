import fs from 'node:fs/promises';
import path from 'node:path';

export const isFile = async (filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
};

export const findFile = async (cwd: string, fileName: string): Promise<string | undefined> => {
  const filePath = path.join(cwd, fileName);
  if (await isFile(filePath)) {
    return filePath;
  } else {
    const parentDir = path.resolve(cwd, '..');
    return parentDir === '/' ? undefined : findFile(parentDir, fileName);
  }
};
