import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/typescript-extends-package');

test('Credit a tsconfig extends package without a typescript dependency', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!issues.devDependencies['packages/app/package.json']?.['@plugins/typescript-extends-package__config']);
});
