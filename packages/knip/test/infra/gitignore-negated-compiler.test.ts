import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/gitignore-negated-compiler');

test('Gitignore negation is honored for compiler-extension glob results', async () => {
  const options = await createOptions({ cwd, isUseTscFiles: true });
  const { issues, counters } = await main(options);

  assert(!('dist/Widget.svelte' in issues.files));
  assert('lib/dist/Panel.svelte' in issues.files);

  assert.deepEqual(counters, { ...baseCounters, dependencies: 1, files: 1, processed: 3, total: 3 });
});
