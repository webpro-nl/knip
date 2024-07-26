import { createRequire as nodeCreateRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { timerify } from './Performance.js';
import { cwd } from './path.js';

/*
 * package.json#exports + self-referencing not supported in `resolve` package nor Bun:
 * - https://github.com/browserify/resolve/issues/289
 * - https://github.com/oven-sh/bun/issues/1137
 * - https://github.com/oven-sh/bun/issues/7644
 */

const createRequire = (path?: string) => nodeCreateRequire(pathToFileURL(path ?? cwd));
const require = createRequire();
export const _require = timerify(require);
