import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/textlint');

test('Find dependencies with the textlint plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['.textlintrc.json']['textlint-rule-terminology']);
  assert(issues.unlisted['config/docs.textlintrc.json']['@textlint-ja/textlint-rule-no-synonyms']);
  assert.equal(issues.unlisted['.textlintrc.json']['textlint-rule-write-good'], undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 2,
    processed: 0,
    total: 0,
  });
});
