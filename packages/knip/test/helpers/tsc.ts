import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
// oxlint-disable-next-line no-restricted-imports
import { dirname } from 'node:path';
import { join } from '../../src/util/path.ts';

const require = createRequire(import.meta.url);
const packagePath = require.resolve('typescript/package.json');
const { bin } = require(packagePath);
const tscBin = join(dirname(packagePath), bin.tsc);

export const tsc = (cwd: string) =>
  spawnSync(process.execPath, [tscBin, '-p', '.'], { cwd, env: { PATH: process.env.PATH, NO_COLOR: '1' } });
