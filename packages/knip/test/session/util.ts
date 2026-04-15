import assert from 'node:assert/strict';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

export const describeFile = async (cwd: string, relativePath: string) => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  const filePath = join(options.cwd, relativePath);
  const descriptor = session.describeFile(filePath);
  assert.ok(descriptor, `missing descriptor for ${relativePath}`);
  return { file: descriptor, cwd: options.cwd };
};
