import { createRequire } from 'node:module';
import { toPosix } from './path.js';
import { timerify } from './performance.js';

export const _createRequire = timerify(createRequire);

const require = _createRequire(process.cwd());

const resolve = (specifier: string) => toPosix(require.resolve(specifier));

export const tryResolve = (specifier: string) => {
  try {
    return resolve(specifier);
  } catch (error) {
    // Intentionally ignored, exceptions are thrown for specifiers being packages (e.g. `node --loader tsx index.ts`)
  }
};

export const _require = timerify(require);

export const _resolve = timerify(resolve);
