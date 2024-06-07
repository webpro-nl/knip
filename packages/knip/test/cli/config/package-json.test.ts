import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/config/package-json');

const exec = execFactory(cwd);

test('Support loading package.json for configuration', async () => {
  assert.equal(exec('knip').stdout, '');
});
