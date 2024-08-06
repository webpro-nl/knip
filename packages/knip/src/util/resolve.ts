import fs from 'node:fs';
import ER from 'enhanced-resolve';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { timerify } from './Performance.js';
import { toPosix } from './path.js';

// @ts-ignore error TS2345 (not in latest): Argument of type 'typeof import("node:fs")' is not assignable to parameter of type 'BaseFileSystem'.
const fileSystem = new ER.CachedInputFileSystem(fs, 9999999);

export const createSyncResolver = (extensions: string[]) => {
  const resolver = ER.create.sync({
    fileSystem,
    extensions,
    conditionNames: ['require', 'import', 'node', 'default'],
  });

  return function resolveSync(specifier: string, baseDir: string) {
    try {
      const resolved = resolver({}, baseDir, specifier);
      if (resolved) return toPosix(resolved);
    } catch (_error) {}
  };
};

const resolveSync = createSyncResolver([...DEFAULT_EXTENSIONS, '.json']);

export const _resolveSync = timerify(resolveSync);
