import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/config/json');

const exec = execFactory(cwd);

test('Support loading json files for configuration', async () => {
  assert.equal(exec('knip').stdout, '');
});
