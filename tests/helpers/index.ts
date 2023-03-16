import { createRequire } from 'node:module';
import os from 'node:os';
import { join } from '../../src/util/path.js';
import type { PackageJson } from 'type-fest';

const _require = createRequire(process.cwd());

export const getManifest = (cwd: string): PackageJson => _require(join(cwd, 'package.json'));

export const isWindows = os.platform() === 'win32';
