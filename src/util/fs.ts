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

export const findFile = async (cwd: string, workingDir: string, fileName: string): Promise<string | undefined> => {
  const filePath = path.join(workingDir, fileName);
  if (await isFile(filePath)) {
    return filePath;
  } else {
    if (cwd === workingDir) return;
    const parentDir = path.resolve(workingDir, '..');
    return findFile(cwd, parentDir, fileName);
  }
};

export const loadJSON = async (filePath: string) => {
  const module = await import(filePath, {
    assert: {
      type: 'json',
    },
  });
  return module && module.default;
};
