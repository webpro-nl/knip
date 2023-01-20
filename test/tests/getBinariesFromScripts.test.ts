import assert from 'node:assert/strict';
import test from 'node:test';
import { getBinariesFromScripts as b } from '../../src/util/binaries/index.js';
import type { PackageJson } from 'type-fest';

const manifest: PackageJson = {};
const ignore = [];
const opts = { manifest, ignore };
const scripts = { ...opts, manifest: { scripts: { program: '' } } };

test('getBinariesFromScripts', async () => {
  assert.deepEqual(b(['program'], opts), ['program']);
  assert.deepEqual(b(['program', 'program'], opts), ['program']);
  assert.deepEqual(b(['program -short --long args'], opts), ['program']);
  assert.deepEqual(b(['program && program2'], opts), ['program', 'program2']);
  assert.deepEqual(b(['program -x && exec -y -- program2 -z'], opts), ['program', 'exec', 'program2']);
  assert.deepEqual(b(['program -s .'], opts), ['program']);
  assert.deepEqual(b(['node -r script'], opts), ['script']);
  assert.deepEqual(b(['node -r package/script'], opts), ['package']);
  assert.deepEqual(b(['node -r ./script.js'], opts), []);
  assert.deepEqual(b(['node --require=pkg1 --require pkg2'], opts), ['pkg1', 'pkg2']);
  assert.deepEqual(b(['node --experimental-loader ts-node/esm/transpile-only'], opts), ['ts-node']);
  assert.deepEqual(b(['node -r @scope/package/register src/index.ts'], opts), ['@scope/package']);
  assert.deepEqual(b(['program --loader tsx --test "test/*.spec.ts"'], opts), ['program', 'tsx']);
  assert.deepEqual(b(['program --loader ldr --loader tsx --test "test/*.spec.ts"'], opts), ['program', 'ldr', 'tsx']);

  assert.deepEqual(b(['./node_modules/.bin/tsc --noEmit'], opts), ['tsc']);
  assert.deepEqual(b(['node_modules/.bin/tsc --noEmit'], opts), ['tsc']);
  assert.deepEqual(b(['$(npm bin)/tsc --noEmit'], opts), ['tsc']);
  assert.deepEqual(b(['../../../scripts/node_modules/.bin/tsc --noEmit'], opts), []);

  assert.deepEqual(b(['program command'], opts), ['program']);

  assert.deepEqual(b(['dotenv program'], opts), ['dotenv', 'program']);
  assert.deepEqual(b(['dotenv -- program'], opts), ['dotenv', 'program']);

  assert.deepEqual(b(['cross-env VAR=true VAR=true node -r esm build.js'], opts), ['cross-env', 'esm']);
  assert.deepEqual(b(['cross-env program'], opts), ['cross-env', 'program']);
  assert.deepEqual(b(['cross-env NODE_ENV=production program'], opts), ['cross-env', 'program']);
  assert.deepEqual(b(['cross-env NODE_OPTIONS=--max-size=3072 program subcommand'], opts), ['cross-env', 'program']);
  assert.deepEqual(b(['A=1 B=2 cross-env -- program'], opts), ['cross-env', 'program']);
  assert.deepEqual(b(['NODE_ENV=production cross-env -- program --cache'], opts), ['cross-env', 'program']);

  assert.deepEqual(b(['npm run script'], opts), []);
  assert.deepEqual(b(['npm run publish:latest -- --npm-tag=debug --no-push'], opts), []);

  assert.deepEqual(b(['npx -y pkg'], opts), []);
  assert.deepEqual(b(['npx --yes pkg'], opts), []);
  assert.deepEqual(b(['npx --no commitlint --edit ${1}'], opts), ['commitlint']);
  assert.deepEqual(b(['npx --no -- commitlint --edit ${1}'], opts), ['commitlint']);

  assert.deepEqual(b(['pnpm exec program'], opts), ['program']);
  assert.deepEqual(b(['pnpm run program'], opts), ['program']);
  assert.deepEqual(b(['pnpm program'], opts), ['program']);
  assert.deepEqual(b(['pnpm run program'], scripts), []);
  assert.deepEqual(b(['pnpm program'], scripts), []);

  assert.deepEqual(b(['yarn exec program'], opts), ['program']);
  assert.deepEqual(b(['yarn run program'], opts), ['program']);
  assert.deepEqual(b(['yarn program'], opts), ['program']);
  assert.deepEqual(b(['yarn run program'], scripts), []);
  assert.deepEqual(b(['yarn program'], scripts), []);

  assert.deepEqual(b(['deno install --no-check -r -f https://deno.land/x/deploy/deployctl.ts'], opts), []);
});
