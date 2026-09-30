import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';
const cwd = resolve('fixtures/resolution/custom-compiler-source-map');
test('Map dist imports back to custom-compiler source files', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);
  assert.equal(issues.exports['src/index.foo']?.used, undefined);
  assert(issues.exports['src/index.foo']?.unused);
});
