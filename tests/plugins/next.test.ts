import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = path.resolve('tests/fixtures/plugins/next');

test('Find dependencies in Next.js configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['next.config.js']['next-transpile-modules']);
  assert(issues.unlisted['pages/[[...route]].tsx']['react']);
  assert(issues.unlisted['pages/[[...route]].tsx']['react-helmet']);
  assert(issues.unlisted['pages/page.tsx']['react']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 0,
    unlisted: 4,
    processed: 3,
    total: 3,
  });
});
