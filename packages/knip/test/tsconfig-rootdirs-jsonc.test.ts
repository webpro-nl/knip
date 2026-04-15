import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTSConfig } from '../src/util/load-tsconfig.ts';
import { resolve } from '../src/util/path.ts';

const cwd = resolve('fixtures/tsconfig-rootdirs-jsonc');

test('Resolve rootDirs against the file that declared them when workspace tsconfig has trailing commas (JSONC)', async () => {
  const { compilerOptions } = await loadTSConfig(`${cwd}/tsconfig.json`);

  assert.deepEqual(compilerOptions.rootDirs, [`${cwd}/shared`, `${cwd}/shared/types`]);
});
