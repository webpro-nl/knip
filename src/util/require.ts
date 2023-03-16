import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { debugLog } from './debug.js';
import { toPosix, join } from './path.js';
import { timerify } from './performance.js';

const require = createRequire(process.cwd());

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

export const resolveSpecifier = (dir: string, specifier: string) => {
  try {
    const require = createRequire(pathToFileURL(join(dir, 'package.json')));
    return toPosix(require.resolve(specifier));
  } catch (err) {
    debugLog(`Unable to resolve ${specifier} (from ${dir})`);
  }
};

export const _resolveSpecifier = timerify(resolveSpecifier);
