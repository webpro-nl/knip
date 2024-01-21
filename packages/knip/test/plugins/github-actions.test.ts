import assert from 'node:assert/strict';
import test from 'node:test';
import { default as GithubActions } from '../../src/plugins/github-actions/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/github-actions');
const options = buildOptions(cwd);

test('Find dependencies in github-actions workflow configurations', async () => {
  const configFilePath = join(cwd, '.github/workflows/test.yml');
  const dependencies = await GithubActions.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [
    join(cwd, 'comment.ts'),
    'esbuild-register',
    join(cwd, 'scripts/check-dependencies.js'),
    'bin:playwright',
    'bin:prisma',
    'bin:eslint',
    'bin:release-it',
    'bin:knip',
    'bin:nyc',
    'retry-cli',
    'bin:curl',
    '@scope/retry-cli',
    'bin:changeset',
    'bin:wait-on',
    join(cwd, 'scripts/get-release-notes.js'),
  ]);
});

test('Find dependencies in github-actions composite action', async () => {
  const configFilePath = join(cwd, '.github/actions/composite/action.yml');
  const dependencies = await GithubActions.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [join(cwd, 'comment.ts'), 'esbuild-register', 'bin:playwright', 'bin:eslint']);
});

test('Find dependencies in github-actions node action A', async () => {
  const configFilePath = join(cwd, '.github/actions/node-a/action.yml');
  const dependencies = await GithubActions.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [
    join(cwd, '.github/actions/node-a/dist/pre.js'),
    join(cwd, '.github/actions/node-a/main.js'),
    join(cwd, '.github/actions/node-a/post.js'),
  ]);
});

test('Find dependencies in github-actions node action B', async () => {
  const configFilePath = join(cwd, '.github/actions/node-b/action.yaml');
  const dependencies = await GithubActions.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [join(cwd, '.github/actions/node-b/main.js')]);
});
