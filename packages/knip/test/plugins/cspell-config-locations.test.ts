import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find CSpell dependencies in .cspell.jsonc', async () => {
  const cwd = resolve('fixtures/plugins/cspell-config-locations');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.devDependencies['package.json']['@cspell/dict-typescript']);
  assert(issues.unlisted['.cspell.jsonc']['@cspell/dict-cryptocurrencies']);
  assert(issues.devDependencies['package.json']['@cspell/dict-node']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 2,
    unlisted: 1,
    processed: 0,
    total: 0,
  });
});
