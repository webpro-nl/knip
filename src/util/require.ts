import { createRequire } from 'node:module';
import { timerify } from './performance.js';

const require = createRequire(process.cwd());

export const tryResolve = (specifier: string) => {
  try {
    return require.resolve(specifier);
  } catch (error) {
    // Intentionally ignored, exceptions are thrown for specifiers being packages (e.g. `node --loader tsx index.ts`)
  }
};

export const _require = timerify(require);

export const _resolve = timerify(require.resolve);
