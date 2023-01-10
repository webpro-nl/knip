import { createRequire } from 'node:module';
import path from 'node:path';
import { PackageJson } from 'type-fest';

const _require = createRequire(process.cwd());
export const getManifest = (cwd: string): PackageJson => _require(path.join(cwd, 'package.json'));
