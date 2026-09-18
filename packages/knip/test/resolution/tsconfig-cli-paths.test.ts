import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/tsconfig-cli-paths');

test('Resolve modules using paths from the selected tsconfig file', async () => {
  const options = await createOptions({ cwd, args: { include: ['files'], tsConfig: 'tsconfig.app.json' } });
  const { issues, counters } = await main(options);

  assert(issues.files['src/unused.ts']);
  assert(!issues.files['src/used.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});
