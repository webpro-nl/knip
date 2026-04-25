import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
// oxlint-disable-next-line no-restricted-imports
import { dirname } from 'node:path';
import { join } from '../../src/util/path.ts';

const require = createRequire(import.meta.url);
const tsgoBin = join(dirname(require.resolve('@typescript/native-preview/package.json')), 'bin/tsgo.js');

export const tsgo = (cwd: string) =>
  spawnSync(process.execPath, [tsgoBin, '-p', '.'], { cwd, env: { PATH: process.env.PATH, NO_COLOR: '1' } });
