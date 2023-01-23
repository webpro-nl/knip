import assert from 'node:assert/strict';
import test from 'node:test';
import { _getBinariesFromScripts as b } from '../../src/util/binaries/index.js';

const scripts = { manifest: { scripts: { program: '' } } };
const knownOnly = { knownGlobalsOnly: true };

test('getBinariesFromScripts', async () => {
  assert.deepEqual(b('program'), ['program']);
  assert.deepEqual(b(['program', 'program']), ['program']);
  assert.deepEqual(b('program -short --long args'), ['program']);
  assert.deepEqual(b('program && program2'), ['program', 'program2']);
  assert.deepEqual(b('program -x && exec -y -- program2 -z'), ['program', 'exec']);
  assert.deepEqual(b('program -x; exec -y -- program2'), ['program', 'exec']);
  assert.deepEqual(b("program '*.js' -- program2"), ['program']);
  assert.deepEqual(b('program -s .'), ['program']);
  assert.deepEqual(b('node -r script'), ['script']);
  assert.deepEqual(b('node -r package/script'), ['package']);
  assert.deepEqual(b('node -r ./script.js'), []);
  assert.deepEqual(b('node --require=pkg1 --require pkg2'), ['pkg1', 'pkg2']);
  assert.deepEqual(b('node --experimental-loader ts-node/esm/transpile-only'), ['ts-node']);
  assert.deepEqual(b('node -r @scope/package/register src/index.ts'), ['@scope/package']);
  assert.deepEqual(b('nodemon --require dotenv/config ./server.js --watch ./server.js'), ['nodemon', 'dotenv']);
  assert.deepEqual(b('program --loader tsx --test "test/*.spec.ts"'), ['program', 'tsx']);
  assert.deepEqual(b('program --loader ldr --loader tsx --test "test/*.spec.ts"'), ['program', 'ldr', 'tsx']);
  assert.deepEqual(b('program command'), ['program']);
});

test('getBinariesFromScripts (.bin)', async () => {
  assert.deepEqual(b('./node_modules/.bin/tsc --noEmit'), ['tsc']);
  assert.deepEqual(b('node_modules/.bin/tsc --noEmit'), ['tsc']);
  assert.deepEqual(b('$(npm bin)/tsc --noEmit'), ['tsc']);
  assert.deepEqual(b('../../../scripts/node_modules/.bin/tsc --noEmit'), []);
});

test('getBinariesFromScripts (dotenv)', async () => {
  assert.deepEqual(b('dotenv program'), ['dotenv', 'program']);
  assert.deepEqual(b('dotenv -- program'), ['dotenv', 'program']);
  assert.deepEqual(b('dotenv -e .env3 -v VARIABLE=somevalue program -- exit'), ['dotenv', 'program']);
  assert.deepEqual(b('dotenv -- mvn exec:java -Dexec.args="-g -f"'), ['dotenv', 'mvn']);
});

test('getBinariesFromScripts (knownGlobalsOnly)', async () => {
  assert.deepEqual(b('dotenv', knownOnly), []);
  assert.deepEqual(b('dotenv -- mvn exec:java -Dexec.args="-g -f"', knownOnly), []);
});

test('getBinariesFromScripts (cross-env)', async () => {
  assert.deepEqual(b('cross-env program'), ['cross-env', 'program']);
  assert.deepEqual(b('cross-env NODE_ENV=p program'), ['cross-env', 'program']);
  assert.deepEqual(b('cross-env NODE_ENV=p program subcommand'), ['cross-env', 'program']);
  assert.deepEqual(b('cross-env NODE_ENV=p node -r node_modules/dotenv/config ./s.js'), ['cross-env', 'dotenv']);
  assert.deepEqual(b('cross-env NODE_ENV=p node -r esm build.js'), ['cross-env', 'esm']);
  assert.deepEqual(b('cross-env NODE_OPTIONS=--max-size=3072 program subcommand'), ['cross-env', 'program']);
  assert.deepEqual(b('cross-env NODE_ENV=p program -r pkg/config ./s.js -w ./s.js'), ['cross-env', 'program', 'pkg']);
  assert.deepEqual(b('NODE_ENV=p cross-env -- program --cache'), ['cross-env', 'program']);
});

test('getBinariesFromScripts (npm)', async () => {
  assert.deepEqual(b('npm run script'), []);
  assert.deepEqual(b('npm run publish:latest -- --npm-tag=debug --no-push'), []);
});

test('getBinariesFromScripts (npx)', async () => {
  assert.deepEqual(b('npx -y pkg'), []);
  assert.deepEqual(b('npx --yes pkg'), []);
  assert.deepEqual(b('npx --no commitlint --edit ${1}'), ['commitlint']);
  assert.deepEqual(b('npx --no -- commitlint --edit ${1}'), ['commitlint']);
});

test('getBinariesFromScripts (pnpm)', async () => {
  assert.deepEqual(b('pnpm exec program'), ['program']);
  assert.deepEqual(b('pnpm run program'), ['program']);
  assert.deepEqual(b('pnpm program'), ['program']);
  assert.deepEqual(b('pnpm run program', scripts), []);
  assert.deepEqual(b('pnpm program', scripts), []);
});

test('getBinariesFromScripts (yarn)', async () => {
  assert.deepEqual(b('yarn exec program'), ['program']);
  assert.deepEqual(b('yarn run program'), ['program']);
  assert.deepEqual(b('yarn program'), ['program']);
  assert.deepEqual(b('yarn run program', scripts), []);
  assert.deepEqual(b('yarn program', scripts), []);
});

test('getBinariesFromScripts (misc)', async () => {
  assert.deepEqual(b('deno install --no-check -r -f https://deno.land/x/deploy/deployctl.ts'), []);
});

test('getBinariesFromScripts (bash expressions)', async () => {
  assert.deepEqual(b('if test "$NODE_ENV" = "production" ; then make install ; fi '), ['make']);
  assert.deepEqual(b('node -e "if (NODE_ENV === \'production\'){process.exit(1)} " || make install'), ['make']);
  assert.deepEqual(b('if ! npx program --verbose ; then exit 1 ; fi'), ['program']);
});

test('getBinariesFromScripts (multiline)', async () => {
  assert.deepEqual(b('#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\nnpx lint-staged'), ['lint-staged']);
  assert.deepEqual(b(`for S in "s"; do\n\tnpx rc@0.6.0\n\tnpx @scope/rc@0.6.0\ndone`), ['rc', '@scope/rc']);
});
