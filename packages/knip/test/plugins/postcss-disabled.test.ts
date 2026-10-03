import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/postcss-disabled');

test('Ignore disabled plugins in object-form PostCSS config', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(issues.devDependencies['package.json']?.['autoprefixer']);
  assert(!issues.devDependencies['package.json']?.['postcss']);
});
