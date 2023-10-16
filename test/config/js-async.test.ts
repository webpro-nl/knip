import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from '../../src/util/path.js';

const cwd = resolve('fixtures/config/js-async');

const exec = (command: string) => {
  try {
    const output = execSync(command.replace(/^knip/, 'node ../../../dist/cli.js'), { cwd });
    return output.toString().trim();
  } catch (error) {
    if (error instanceof Error && 'stdout' in error && Buffer.isBuffer(error['stdout'])) {
      return error['stdout'].toString();
    }
    // Unknown error
    throw error;
  }
};

test('Support loading js async function for configuration', async () => {
  assert.equal(exec('knip'), '');
});
