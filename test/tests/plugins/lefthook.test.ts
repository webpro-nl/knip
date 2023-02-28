import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as lefthook from '../../../src/plugins/lefthook/index.js';
import { getManifest } from '../../helpers/index.js';

const cwd = path.resolve('test/fixtures/plugins/lefthook');
const manifest = getManifest(cwd);

test('Find dependencies in lefthook configuration (json)', async () => {
  const configFilePath = path.join(cwd, 'lefthook.yml');
  const dependencies = await lefthook.findDependencies(configFilePath, {
    manifest,
    cwd,
    rootConfig: { ignoreBinaries: [] },
  });
  assert.deepEqual(dependencies, { dependencies: ['eslint'], entryFiles: [path.join(cwd, 'example.mjs')] });
});
