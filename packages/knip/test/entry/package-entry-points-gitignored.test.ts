import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/entry/package-entry-points-gitignored');

test('Exclude gitignored and null package entry points', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert('helper.js' in issues.files);
  assert('hidden.js' in issues.files);
  assert(!('dist/generated.js' in issues.files));
  assert(!('dist/extra.js' in issues.files));

  const filePath = join(cwd, 'package.json');
  assert.deepEqual(configurationHints, [
    { type: 'package-entry', identifier: './missing.js', workspaceName: '.', filePath },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 3,
    total: 3,
  });
});
