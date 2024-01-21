import assert from 'node:assert/strict';
import test from 'node:test';
import { default as semanticRelease } from '../../src/plugins/semantic-release/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/semantic-release');
const options = buildOptions(cwd);

test('Find dependencies in semantic-release package.json configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await semanticRelease.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/git',
    '@semantic-release/npm',
    '@semantic-release/github',
  ]);
});

test('Find dependencies in semantic-release .releaserc configuration (yaml)', async () => {
  const configFilePath = join(cwd, '.releaserc');
  const dependencies = await semanticRelease.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/git',
    '@semantic-release/npm',
    '@semantic-release/github',
  ]);
});
