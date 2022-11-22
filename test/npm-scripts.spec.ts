import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as npm from '../src/npm-scripts';

const cwd = path.resolve('test/fixtures/npm-scripts');

test('Unused dependencies in npm scripts', async () => {
  const ignoreBinaries = ['bash', 'rm'];

  const manifest = {
    scripts: {
      nodemon: 'nodemon index.js',
      build: 'rm -rf && dotenv -- nx build npm-scripts',
      pm2: 'NODE_ENV=production pm2 start index.js',
      dev: 'pm2-dev start index.js',
      test: 'bash test/unit.sh && bash test/e2e.sh',
    },
    dependencies: { express: '*' },
    devDependencies: { pm2: '*', nx: '*', unused: '*' },
  };

  const { dependencies } = await npm.findDependencies(ignoreBinaries, manifest, true, cwd, cwd);

  assert.deepEqual(dependencies, ['nodemon', 'dotenv', 'nx', 'pm2']);
});
