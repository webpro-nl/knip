import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/declaration-dir-source-map');

test('Map declarationDir entries back to source files for linked workspaces', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!issues.types['packages/contracts/src/index.ts']?.UsedType);
  assert(issues.types['packages/contracts/src/index.ts']?.UnusedType);
  assert(!issues.exports['packages/contracts/src/index.ts']?.usedRuntime);
  assert(issues.exports['packages/contracts/src/index.ts']?.unusedRuntime);
});
