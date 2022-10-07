import test from 'node:test';
import assert from 'node:assert';
import { run } from '../src/index';
import baseConfig from './fixtures/baseConfig';

test('run', async () => {
  const { issues, counters } = await run({
    ...baseConfig,
    cwd: 'test/fixtures/basic',
    entryFiles: ['index.ts'],
    filePatterns: ['*.ts'],
  });

  assert(counters.files === 1);
  assert(issues.files.size === 1);
  assert(Array.from(issues.files)[0].endsWith('dangling.ts'));

  assert(counters.exports === 1);
  assert(Object.values(issues.exports).length === 1);
  assert(issues.exports['dep.ts']['unused'].symbol === 'unused');

  assert(counters.types === 1);
  assert(Object.values(issues.types).length === 1);
  assert(issues.types['dep.ts']['Dep'].symbolType === 'type');

  assert(counters.nsExports === 1);
  assert(Object.values(issues.nsExports).length === 1);
  assert(issues.nsExports['ns.ts']['z'].symbol === 'z');

  assert(counters.nsTypes === 1);
  assert(Object.values(issues.nsTypes).length === 1);
  assert(issues.nsTypes['ns.ts']['NS'].symbol === 'NS');

  assert(counters.duplicates === 1);
  assert(Object.values(issues.duplicates).length === 1);
  assert(issues.duplicates['dep.ts']['dep,default'].symbols?.[0] === 'dep');
});
