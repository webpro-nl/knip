import assert from 'node:assert/strict';
import test from 'node:test';
import * as GithubActions from '../../src/plugins/github-actions/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('tests/fixtures/plugins/github-actions');
const manifest = getManifest(cwd);

test('Find dependencies in github-actions workflow configurations', async () => {
  const configFilePath = join(cwd, '.github/workflows/test.yml');
  const dependencies = await GithubActions.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, [
    'esbuild-register',
    'playwright',
    'prisma',
    'bin:eslint',
    'bin:release-it',
    'bin:knip',
    'bin:nyc',
    'bin:playwright',
    'retry-cli',
    'bin:curl',
    '@scope/retry-cli',
    'bin:changeset',
    'bin:wait-on',
    join(cwd, 'scripts/get-release-notes.js'),
  ]);
});
