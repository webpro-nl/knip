import { cp, mkdtemp, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, toPosix } from '../../src/util/path.ts';
import { resolve } from './resolve.ts';

export const copyFixture = async (fixturePath: string, prefix = 'knip-fixture-') => {
  const cwd = toPosix(await realpath(await mkdtemp(join(tmpdir(), prefix))));
  await cp(resolve(fixturePath), cwd, { recursive: true });
  return cwd;
};
