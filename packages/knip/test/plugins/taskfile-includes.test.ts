import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/taskfile-includes');

test('Resolve the script entries of included Taskfiles from the workspace directory', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.files).sort(), ['taskfiles/specs/app.spec.js', 'unit/specs/app.spec.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 3,
    total: 3,
  });
});
