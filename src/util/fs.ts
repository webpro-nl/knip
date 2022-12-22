import fs from 'node:fs/promises';
import path from 'node:path';
import stripJsonComments from 'strip-json-comments';

export const isFile = async (filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
};

export const findFile = async (workingDir: string, fileName: string): Promise<string | undefined> => {
  const filePath = path.join(workingDir, fileName);
  return (await isFile(filePath)) ? filePath : undefined;
};

export const loadJSON = async (filePath: string) => {
  const contents = await fs.readFile(filePath);
  return JSON.parse(stripJsonComments(contents.toString()));
};
