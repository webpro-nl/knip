import { join } from '../../src/util/path.js';
import { _require } from '../../src/util/require.js';
import type { PackageJson } from 'type-fest';

export const getManifest = (cwd: string): PackageJson => _require(join(cwd, 'package.json'));
