import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as GithubActions from '../../../src/plugins/github-actions/index.js';
import { getManifest } from '../../helpers/index.js';

const cwd = path.resolve('test/fixtures/plugins/github-actions');
const manifest = getManifest(cwd);
const rootConfig = { ignoreBinaries: ['knip'] };

test('Find dependencies in github-actions workflow configurations', async () => {
  const configFilePath = path.join(cwd, '.github/workflows/test.yml');
  const dependencies = await GithubActions.findDependencies(configFilePath, { manifest, rootConfig });
  assert.deepEqual(dependencies, [
    'esbuild-register',
    'playwright',
    'prisma',
    'eslint',
    'release-it',
    'nyc',
    'retry-cli',
    '@scope/retry-cli',
    'changeset',
    'wait-on',
  ]);
});
