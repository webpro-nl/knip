import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { getValuesByKeyDeep } from '../src/util/object.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/rules');

test('Respect warnings in rules', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  const severities = getValuesByKeyDeep(issues, 'severity');

  assert(severities.every(severity => severity === 'warn'));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 1,
    devDependencies: 1,
    optionalPeerDependencies: 1,
    unlisted: 1,
    binaries: 1,
    unresolved: 1,
    exports: 2,
    types: 2,
    duplicates: 1,
    enumMembers: 1,
    classMembers: 1,
    processed: 4,
    total: 4,
  });
});
