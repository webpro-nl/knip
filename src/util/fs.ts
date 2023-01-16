import { statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import stripJsonComments from 'strip-json-comments';

export const isFile = (filePath: string) => {
  const stat = statSync(filePath, { throwIfNoEntry: false });
  return stat !== undefined && stat.isFile();
};

export const findFile = (workingDir: string, fileName: string) => {
  const filePath = path.join(workingDir, fileName);
  return isFile(filePath) ? filePath : undefined;
};

export const loadJSON = async (filePath: string) => {
  const contents = await readFile(filePath);
  return JSON.parse(stripJsonComments(contents.toString()));
};
