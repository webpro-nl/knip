import { createRequire } from 'node:module';
import path from 'node:path';
import { toPosixPath } from '../../src/util/path';
import type { PackageJson } from 'type-fest';

const _require = createRequire(process.cwd());
export const getManifest = (cwd: string): PackageJson => _require(path.join(cwd, 'package.json'));

export const joinPosix = (...args: string[]) => toPosixPath(path.join(...args));
