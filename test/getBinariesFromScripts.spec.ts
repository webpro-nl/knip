import assert from 'node:assert/strict';
import test from 'node:test';
import { getBinariesFromScripts as b } from '../src/manifest/helpers';

test('getBinariesFromScripts', async () => {
  assert.deepEqual(b(['program']), ['program']);
  assert.deepEqual(b(['program', 'program']), ['program']);
  assert.deepEqual(b(['program -short --long args']), ['program']);
  assert.deepEqual(b(['program && program2']), ['program', 'program2']);
  assert.deepEqual(b(['dotenv -- program']), ['dotenv', 'program']);
  assert.deepEqual(b(['program -x && exec -y -- program2 -z']), ['program', 'exec', 'program2']);
  assert.deepEqual(b(['program -s .']), ['program']);
  assert.deepEqual(b(['node -r script']), ['node', 'script']);
  assert.deepEqual(b(['node -r package/script']), ['node', 'package']);
  assert.deepEqual(b(['node -r ./script.js']), ['node']);
  assert.deepEqual(b(['node --require=pkg1 --require pkg2']), ['node', 'pkg1', 'pkg2']);
  assert.deepEqual(b(['node --experimental-loader ts-node/esm/transpile-only']), ['node', 'ts-node']);
  assert.deepEqual(b(['node -r @scope/package/register src/index.ts']), ['node', '@scope/package']);
  assert.deepEqual(b(['NODE_ENV=production cross-env -- program --cache']), ['cross-env', 'program']);
  assert.deepEqual(b(['A=1 B=2 cross-env -- program']), ['cross-env', 'program']);
  assert.deepEqual(b(['cross-env VAR=true VAR=true node -r esm build.js']), ['cross-env', 'node', 'esm']);
  assert.deepEqual(b(['program --loader tsx --test "test/*.spec.ts"']), ['program', 'tsx']);
  assert.deepEqual(b(['program --loader loader --loader tsx --test "test/*.spec.ts"']), ['program', 'loader', 'tsx']);

  assert.deepEqual(b(['./node_modules/.bin/tsc --noEmit']), ['tsc']);
  assert.deepEqual(b(['node_modules/.bin/tsc --noEmit']), ['tsc']);
  assert.deepEqual(b(['$(npm bin)/tsc --noEmit']), ['tsc']);
  assert.deepEqual(b(['../../../scripts/node_modules/.bin/tsc --noEmit']), []);

  assert.deepEqual(b(['program command']), ['program']);
  assert.deepEqual(b(['dotenv program']), ['dotenv', 'program']);

  assert.deepEqual(b(['cross-env program']), ['cross-env', 'program']);
  assert.deepEqual(b(['cross-env NODE_ENV=production program']), ['cross-env', 'program']);
  assert.deepEqual(b(['cross-env NODE_OPTIONS=--max-old-size=3072 program storybook:build']), ['cross-env', 'program']);

  assert.deepEqual(b(['npm run script']), ['npm']);
  assert.deepEqual(b(['npm run publish:latest -- --npm-tag=debug --no-push']), ['npm']);

  assert.deepEqual(b(['npx -y pkg']), ['npx', 'pkg']);
});
