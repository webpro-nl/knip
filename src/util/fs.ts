import { statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import stripJsonComments from 'strip-json-comments';
import { LoaderError } from './errors.js';
import { join } from './path.js';

export const isFile = (filePath: string) => {
  const stat = statSync(filePath, { throwIfNoEntry: false });
  return stat !== undefined && stat.isFile();
};

export const findFile = (workingDir: string, fileName: string) => {
  const filePath = join(workingDir, fileName);
  return isFile(filePath) ? filePath : undefined;
};

export const loadJSON = async (filePath: string) => {
  try {
    const contents = await readFile(filePath);
    return JSON.parse(stripJsonComments(contents.toString()));
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};
