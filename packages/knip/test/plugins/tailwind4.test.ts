import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/tailwind4');

test('Find dependencies and the literal --input path with the Tailwind plugin (4)', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['src/t/theme.css']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 2,
    total: 2,
  });
});
