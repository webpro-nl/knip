import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find dependencies with the npm-package-json-lint plugin', async () => {
  const cwd = resolve('fixtures/plugins/npm-package-json-lint');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['.npmpackagejsonlintrc.json']['npm-package-json-lint-config-default']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 1,
    processed: 0,
    total: 0,
  });
});

test('Find dependencies in an npm-package-json-lint extends array', async () => {
  const cwd = resolve('fixtures/plugins/npm-package-json-lint-extends-array');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['npm-package-json-lint']);
  assert(issues.unlisted['.npmpackagejsonlintrc.json']['@wordpress/npm-package-json-lint-config']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 1,
    processed: 0,
    total: 0,
  });
});
