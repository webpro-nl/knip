import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/type-only-exports-condition');

test('Resolve type-only imports and mixed re-exports through the types export condition', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);
  const declarationTypes = issues.types['packages/contracts/types.d.ts'];

  assert(declarationTypes);
  assert(!declarationTypes.UsedType);
  assert(!declarationTypes.ReExportedType);
  assert(declarationTypes.UnusedType);
  assert(!issues.exports['packages/contracts/runtime.js']?.runtimeValue);
  assert(!issues.exports['packages/contracts/runtime.js']?.reExportedRuntime);
});
