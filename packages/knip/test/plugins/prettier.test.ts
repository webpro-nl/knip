import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/prettier');

test('Find dependencies with the Prettier plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['prettier']);
  assert(issues.unlisted['prettier.config.js']['prettier-plugin-xml']);
  assert(issues.unlisted['prettier.config.js']['prettier-plugin-astro']);
  assert(issues.unlisted['prettier.config.js']['prettier-plugin-java']);
  assert(issues.unlisted['package.json']['@company/prettier-config']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 4,
    processed: 1,
    total: 1,
  });
});

test('Find dependencies with the Prettier plugin (--config arg)', async () => {
  const cwd = resolve('fixtures/plugins/prettier-args');
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(issues.unlisted['my-prettier-settings.js']['my-custom-prettier-plugin']);
});

test('Find dependencies with the Prettier plugin (--config arg with -c check flag)', async () => {
  const cwd = resolve('fixtures/plugins/prettier-check-flag');
  const options = await createOptions({ cwd });
  // Before #1902, -c was aliased to --config causing parsed.config to be
  // ["path", ""] (an array), which crashed on specifier.charCodeAt().
  const { issues, counters } = await main(options);

  // .prettierrc was correctly resolved via --config and its plugin was found
  assert(!issues.unlisted['.prettierrc']);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
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
