import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { findIssues } from '../src/runner';
import { createTestProject } from './helpers';
import baseConfig from './fixtures/baseConfig';

test('findIssues', async () => {
  const workingDir = 'test/fixtures/basic';
  const projectOptions = { skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true };

  const { entryFiles, productionFiles, projectFiles } = createTestProject({
    projectOptions,
    entryFiles: [path.join(workingDir, 'index.ts')],
    projectFiles: [path.join(workingDir, '*.ts')],
  });

  const { issues, counters } = await findIssues({
    ...baseConfig,
    workingDir,
    entryFiles,
    productionFiles,
    projectFiles,
    debug: {
      isEnabled: false,
      level: 0,
    },
  });

  assert.equal(counters.files, 1);
  assert.equal(issues.files.size, 1);
  assert(Array.from(issues.files)[0].endsWith('dangling.ts'));

  assert.equal(counters.exports, 2);
  assert.equal(Object.values(issues.exports).length, 2);
  assert.equal(issues.exports['dep.ts']['unused'].symbol, 'unused');
  assert.equal(issues.exports['default.ts']['notDefault'].symbol, 'notDefault');

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
