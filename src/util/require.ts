import { createRequire } from 'node:module';
import { Workspace } from '../configuration-chief.js';
import { toPosix } from './path.js';
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

export function isSelfReferenceImport(workspace: Workspace, specifier: string) {
  return workspace.pkgName !== undefined && specifier.startsWith(workspace.pkgName);
}

export const _require = timerify(require);

export const _resolve = timerify(resolve);
