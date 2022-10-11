import path from 'node:path';
import type { Configuration } from '../types';

export const addWorkingDirToPattern = (workingDir: string, pattern: string) => {
  if (pattern.startsWith('!')) return '!' + path.join(workingDir, pattern.slice(1));
  return path.join(workingDir, pattern);
};

export const resolvePaths = (configuration: Configuration, patterns: string[]) => {
  const { workingDir } = configuration;
  return patterns.map(pattern => addWorkingDirToPattern(workingDir, pattern));
};
