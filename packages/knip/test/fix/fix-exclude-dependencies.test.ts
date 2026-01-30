import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import { copyFixture } from '../helpers/copy-fixture.js';
import { createOptions } from '../helpers/create-options.js';

test('Fix should not remove dependencies when issue type is excluded', async () => {
  const cwd = await copyFixture('fixtures/fix');
  const pkgPath = join(cwd, 'package.json');
  const original = await readFile(pkgPath, 'utf8');

  const options = await createOptions({ cwd, isFix: true, excludedIssueTypes: ['dependencies'] });
  const { issues, counters } = await main(options);

  assert.equal(counters.dependencies, 0);
  assert.equal(counters.devDependencies, 0);
  assert.deepEqual(issues.dependencies, {});
  assert.deepEqual(issues.devDependencies, {});

  assert.equal(original, await readFile(pkgPath, 'utf8'));
});
