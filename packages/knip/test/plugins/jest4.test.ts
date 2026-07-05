import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/jest4');

test('Find dependencies with the Jest plugin (inline babel-jest presets)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.devDependencies['package.json']?.['@babel/preset-env']);
  assert(!issues.devDependencies['package.json']?.['@babel/preset-typescript']);
  assert(!issues.devDependencies['package.json']?.['babel-plugin-react-compiler']);

  assert(issues.devDependencies['package.json']['jest']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});
