import fs from 'node:fs/promises';
import path from 'node:path';
import { isFile } from './fs';
import { addWorkingDirToPattern } from './path';

export const convertPattern = (pattern: string) => (pattern.startsWith('!') ? pattern.substring(1) : `!${pattern}`);

const readIgnoreFile = async (filePath: string) => {
  let contents = '';
  try {
    contents = (await fs.readFile(filePath)).toString();
  } catch (error) {
    // TODO
  }
  return contents.split(/\r?\n/).filter(line => line && !line.startsWith('#'));
};

const traverseDirs = async (rootDir: string, currentDir: string, patterns: string[] = []): Promise<string[]> => {
  const gitIgnorePath = path.join(currentDir, '.gitignore');
  const parentDir = path.resolve(currentDir, '..');
  if (await isFile(gitIgnorePath)) {
    (await readIgnoreFile(gitIgnorePath))
      .map(pattern => addWorkingDirToPattern(currentDir, pattern))
      .forEach(pattern => patterns.push(pattern));
  }
  if (rootDir === currentDir || parentDir === '/') return patterns;

  return traverseDirs(rootDir, parentDir, patterns);
};

export const readIgnorePatterns = async (cwd: string, workingDir: string) => {
  const patterns = await traverseDirs(cwd, workingDir);
  return patterns.map(convertPattern);
};
