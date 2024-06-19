import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/config/mjs-async');

const exec = execFactory(cwd);

test('Support loading mjs async function files for configuration', async () => {
  assert.equal(exec('knip -c knip.mjs').stdout, '');
});
