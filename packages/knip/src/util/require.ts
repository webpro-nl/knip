import { createRequire as nodeCreateRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import createJITI from 'jiti';
import { debugLog } from './debug.js';
import { getPackageNameFromModuleSpecifier } from './modules.js';
import { cwd, toPosix, join } from './path.js';
import { timerify } from './Performance.js';
import { jitiCJS } from './register.js';

const createRequire = (path?: string) => nodeCreateRequire(pathToFileURL(path ?? cwd));
const require = createRequire();
export const _require = timerify(require);

const resolve = (specifier: string) => toPosix(jitiCJS.resolve(specifier));

const tryResolve = (specifier: string, from: string) => {
  try {
    return resolve(specifier);
  } catch {
    debugLog('*', `Unable to resolve ${specifier} (from ${from})`);
  }
};

const resolveSpecifier = (dir: string, specifier: string) => {
  try {
    // @ts-expect-error Our package.json has type=module (for globby, picocolors, etc), but here it confuses TypeScript
    const jiti = createJITI(dir);
    return toPosix(jiti.resolve(specifier));
  } catch {
    const packageName = getPackageNameFromModuleSpecifier(specifier);
    if (packageName) {
      const relativeSpecifier = specifier.replace(packageName, '.');
      return tryResolve(join(dir, relativeSpecifier), dir);
    }
  }
};

export const _resolve = timerify(resolve);

export const _tryResolve = timerify(tryResolve);

export const _resolveSpecifier = timerify(resolveSpecifier);
