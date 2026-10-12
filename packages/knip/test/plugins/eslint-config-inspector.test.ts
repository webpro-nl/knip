import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/eslint-config-inspector');

test('Find dependencies with the ESLint Config Inspector plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert.equal(issues.devDependencies?.['package.json']?.['@eslint/config-inspector'], undefined);
  assert.equal(issues.binaries?.['package.json']?.['config-inspector'], undefined);
});
