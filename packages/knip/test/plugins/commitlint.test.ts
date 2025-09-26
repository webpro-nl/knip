import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/commitlint');

test('Find dependencies with the Commitizen plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['.commitlintrc.json']['@commitlint/config-conventional']);
  assert(issues.unlisted['.commitlintrc.json']['commitlint-plugin-tense']);
  assert(issues.unlisted['.commitlintrc.json']['conventional-changelog-atom']);

  assert(issues.unlisted['commitlint.config.js']['@commitlint/config-conventional']);
  assert(issues.unlisted['commitlint.config.js']['commitlint-plugin-tense']);
  assert(issues.unlisted['commitlint.config.js']['commitlint-config-lerna']);
  assert(issues.unlisted['commitlint.config.js']['@commitlint/format']);

  assert(issues.unlisted['package.json']['@commitlint/config-conventional']);
  assert(issues.unlisted['package.json']['commitlint-plugin-tense']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 9,
    processed: 1,
    total: 1,
  });
});
