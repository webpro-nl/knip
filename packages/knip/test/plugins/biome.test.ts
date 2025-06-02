import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';

const cwd = resolve('fixtures/plugins/biome');

test('Find dependencies with the biome plugin', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@org/unused-config'])
  assert(issues.unresolved['biome.json']['./shared/non-exist-base.json'])
  assert(issues.unlisted['biome.json']['@org/unlisted-configs'])
});
