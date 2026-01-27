import { cp, mkdtemp, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from '../../src/util/path.js';
import { resolve } from './resolve.js';

export const copyFixture = async (fixturePath: string) => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-fixture-')));
  await cp(resolve(fixturePath), cwd, { recursive: true });
  return cwd;
};
