import { spawnSync } from 'node:child_process';
// oxlint-disable-next-line no-restricted-imports
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { join } from '../../src/util/path.ts';

const tsgoBin = join(dirname(fileURLToPath(import.meta.url)), '../../node_modules/.bin/tsgo');

export const tsgo = (cwd: string) =>
  spawnSync(tsgoBin, ['-p', '.'], { cwd, env: { PATH: process.env.PATH, NO_COLOR: '1' } });
