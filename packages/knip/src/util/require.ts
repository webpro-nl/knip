import { createRequire as nodeCreateRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import createJITI from 'jiti';
import transform from 'jiti/dist/babel.js';
import { debugLog } from './debug.js';
import { getPackageNameFromModuleSpecifier } from './modules.js';
import { cwd, toPosix, join } from './path.js';
import { timerify } from './Performance.js';
import { jitiCJS } from './register.js';
import type { TransformOptions } from 'jiti/dist/types.js';

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

/**
 * Special ESLint config loader to strip problematic lines from source:
 *
 * ```js
 * require('@rushstack/eslint-config/patch/modern-module-resolution');
 * require("@rushstack/eslint-patch/modern-module-resolution");
 * ```
 */
const rushstackMatch = /require\(("|')@rushstack\/(eslint-config\/patch|eslint-patch)\/modern-module-resolution("|')\)/;

// @ts-expect-error Our package.json has type=module (for globby, picocolors, etc), but here it confuses TypeScript
const jiti = createJITI(process.cwd(), {
  cache: false,
  transform: (opts: TransformOptions) => {
    opts.source = opts.source.replace(rushstackMatch, '');
    // @ts-expect-error Same as above
    return transform(opts);
  },
});

const loadESLintConfig = (configFilePath: string) => {
  return jiti(configFilePath);
};

export const _loadESLintConfig = timerify(loadESLintConfig);

export const _resolve = timerify(resolve);

export const _tryResolve = timerify(tryResolve);

export const _resolveSpecifier = timerify(resolveSpecifier);
