import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/prettier');

test('Find dependencies with the Prettier plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['prettier']);
  assert(issues.unlisted['prettier.config.js']['prettier-plugin-xml']);
  assert(issues.unlisted['prettier.config.js']['prettier-plugin-astro']);
  assert(issues.unlisted['package.json']['@company/prettier-config']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 3,
    processed: 1,
    total: 1,
  });
});

test('Find dependencies with the Prettier plugin (.json5 config)', async () => {
  const cwd = resolve('fixtures/plugins/prettier-json5');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['prettier']);
  assert(issues.unlisted['.prettierrc.json5']['prettier-plugin-tailwindcss']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 1,
    processed: 0,
    total: 0,
  });
});

test('Handle re-exported config', async () => {
  const cwd = resolve('fixtures/plugins/prettier-reexport');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.unlisted['prettier.config.js']?.['prettier-plugin-test'], undefined);
  assert.equal(issues.devDependencies['package.json']?.['@org/prettier-config'], undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});
