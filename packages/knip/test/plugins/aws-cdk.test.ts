import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/aws-cdk');

test('Find dependencies with the aws-cdk plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  console.log(issues);

  // assert(issues.binaries['package.json']['cdk']);
  assert(issues.dependencies['package.json']['aws-cdk-lib']);
  assert(issues.dependencies['package.json']['constructs']);
  // assert(issues.devDependencies['package.json']['aws-cdk']);
  assert(issues.devDependencies['package.json']['@types/aws-cdk-lib']);
  assert(issues.devDependencies['package.json']['@types/constructs']);
  assert(issues.devDependencies['package.json']['ts-node']);
  // assert(issues.devDependencies['package.json']['typescript']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
    devDependencies: 4,
    processed: 0,
    total: 0,
  });
});
