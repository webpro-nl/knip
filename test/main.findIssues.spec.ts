import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../src/index.js';
import baseArguments from './fixtures/baseArguments.js';

test('Find various issue types of unused exports', async () => {
  const workspaceDir = path.resolve('test/fixtures/basic');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd: workspaceDir,
  });

  assert.equal(counters.files, 1);
  assert.equal(issues.files.size, 1);
  assert(Array.from(issues.files)[0].endsWith('dangling.ts'));

  assert.equal(counters.exports, 4);
  assert.equal(Object.values(issues.exports).length, 4);
  assert.equal(issues.exports['default.ts']['notDefault'].symbol, 'notDefault');
  assert.equal(issues.exports['dep.ts']['unused'].symbol, 'unused');
  assert.equal(issues.exports['dynamic.ts']['unused'].symbol, 'unused');
  assert.equal(issues.exports['index.ts']['b'].symbol, 'b');

  assert.equal(counters.types, 1);
  assert.equal(Object.values(issues.types).length, 1);
  assert.equal(issues.types['dep.ts']['Dep'].symbolType, 'type');

  assert.equal(counters.nsExports, 1);
  assert.equal(Object.values(issues.nsExports).length, 1);
  assert.equal(issues.nsExports['ns.ts']['z'].symbol, 'z');

  assert.equal(counters.nsTypes, 1);
  assert.equal(Object.values(issues.nsTypes).length, 1);
  assert.equal(issues.nsTypes['ns.ts']['NS'].symbol, 'NS');

  assert.equal(counters.duplicates, 1);
  assert.equal(Object.values(issues.duplicates).length, 1);
  assert.equal(issues.duplicates['dep.ts']['dep|default'].symbols?.[0], 'dep');
});
