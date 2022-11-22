import assert from 'node:assert/strict';
import test from 'node:test';
import { getBinariesFromScripts } from '../src/npm-scripts/helpers';

test('getBinariesFromScripts', async () => {
  assert.deepEqual(getBinariesFromScripts(['program']), ['program']);
  assert.deepEqual(getBinariesFromScripts(['program', 'program']), ['program']);
  assert.deepEqual(getBinariesFromScripts(['program -short --long args']), ['program']);
  assert.deepEqual(getBinariesFromScripts(['program && program2']), ['program', 'program2']);
  assert.deepEqual(getBinariesFromScripts(['dotenv -- program']), ['dotenv', 'program']);
  assert.deepEqual(getBinariesFromScripts(['program -x && exec -y -- program2 -z']), ['program', 'exec', 'program2']);
  assert.deepEqual(getBinariesFromScripts(['program -s .']), ['program']);
  assert.deepEqual(getBinariesFromScripts(['node -r script']), ['node', 'script']);
  assert.deepEqual(getBinariesFromScripts(['node -r package/script']), ['node', 'package']);
  assert.deepEqual(getBinariesFromScripts(['node -r ./script.js']), ['node']);
  assert.deepEqual(getBinariesFromScripts(['node -r @scope/package/register src/index.ts']), [
    'node',
    '@scope/package',
  ]);
  assert.deepEqual(getBinariesFromScripts(['npm run publish:latest -- --npm-tag=debug --no-push']), ['npm']);
  assert.deepEqual(getBinariesFromScripts(['NODE_ENV=production cross-env -- program --cache']), [
    'cross-env',
    'program',
  ]);
  assert.deepEqual(getBinariesFromScripts(['A=1 B=2 cross-env -- program']), ['cross-env', 'program']);
  assert.deepEqual(getBinariesFromScripts(['cross-env VAR=true VAR=true node -r esm build.js']), [
    'cross-env',
    'node',
    'esm',
  ]);
  assert.deepEqual(getBinariesFromScripts(['program --loader tsx --test "test/*.spec.ts"']), ['program', 'tsx']);
  assert.deepEqual(getBinariesFromScripts(['program --loader loader --loader tsx --test "test/*.spec.ts"']), [
    'program',
    'loader',
    'tsx',
  ]);

  assert.deepEqual(getBinariesFromScripts(['./node_modules/.bin/tsc --noEmit']), ['tsc']);
  assert.deepEqual(getBinariesFromScripts(['node_modules/.bin/tsc --noEmit']), ['tsc']);
  assert.deepEqual(getBinariesFromScripts(['$(npm bin)/tsc --noEmit']), ['tsc']);
  assert.deepEqual(getBinariesFromScripts(['../../../scripts/node_modules/.bin/tsc --noEmit']), []);

  assert.deepEqual(getBinariesFromScripts(['program command']), ['program']);
  assert.deepEqual(getBinariesFromScripts(['dotenv program']), ['dotenv', 'program']);
  assert.deepEqual(getBinariesFromScripts(['cross-env NODE_ENV=production program']), ['cross-env', 'program']);
  assert.deepEqual(
    getBinariesFromScripts(['cross-env NODE_OPTIONS=--max-old-space-size=3072 program storybook:build']),
    ['cross-env', 'program']
  );

  assert.deepEqual(getBinariesFromScripts(['cross-env program']), ['cross-env', 'program']);
  assert.deepEqual(getBinariesFromScripts(['npm run script']), ['npm']);
});
