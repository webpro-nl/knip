import { createRequire } from 'node:module';
import { join } from 'node:path';
import { toPosix } from './path.js';
import { timerify } from './performance.js';

const require = createRequire(join(process.cwd(), 'package.json'));

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
