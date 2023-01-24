import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { _getReferencesFromScripts } from '../../src/util/binaries/index.js';

const cwd = path.resolve('test/fixtures/binaries');

const js = path.join(cwd, 'script.js');
const ts = path.join(cwd, 'main.ts');
const req = path.join(cwd, 'require.js');
const index = path.join(cwd, 'dir', 'index.js');

const pkgScripts = { cwd, manifest: { scripts: { program: '' } } };
const knownOnly = { cwd, knownGlobalsOnly: true };

const t = (script, binaries = [], entryFiles = [], options = { cwd }) =>
  assert.deepEqual(_getReferencesFromScripts(script, options), { binaries, entryFiles });

test('getReferencesFromScripts', () => {
  t('program', ['program']);
  t(['program', 'program'], ['program']);
  t('program -short --long args', ['program']);
  t('program && program2', ['program', 'program2']);
  t('program -x && exec -y -- program2 -z', ['program', 'exec']);
  t('program -x; exec -y -- program2', ['program', 'exec']);
  t('program script.js -- program2', ['program']);
  t("program '*.js' -- program2", ['program']);
  t('program -s .', ['program']);
  t('program command', ['program']);
});

test('getReferencesFromScripts (node)', () => {
  t('node -r script.js', [], [js]);
  t('node -r package/script', ['package']);
  t('node -r ./require.js script.js', [], [req, js]);
  t('node --require=pkg1 --require pkg2 script.js', ['pkg1', 'pkg2'], [js]);
  t('node --experimental-loader ts-node/esm/transpile-only script.js', ['ts-node'], [js]);
  t('node -r @scope/package/register ./dir/index.js', ['@scope/package'], [index]);
  t('ts-node --require pkg/register main.ts', ['ts-node', 'pkg'], [ts]);
});

test('getReferencesFromScripts (--require)', () => {
  t('nodemon --require dotenv/config ./server.js --watch ./server.js', ['nodemon', 'dotenv']);
  t('program --loader tsx --test "test/*.spec.ts"', ['program', 'tsx']);
  t('program --loader ldr --loader tsx --test "test/*.spec.ts"', ['program', 'ldr', 'tsx']);
});

test('getReferencesFromScripts (.bin)', () => {
  t('./node_modules/.bin/tsc --noEmit', ['tsc']);
  t('node_modules/.bin/tsc --noEmit', ['tsc']);
  t('$(npm bin)/tsc --noEmit', ['tsc']);
  t('../../../scripts/node_modules/.bin/tsc --noEmit', []);
});

test('getReferencesFromScripts (dotenv)', () => {
  t('dotenv program', ['dotenv', 'program']);
  t('dotenv -- program', ['dotenv', 'program']);
  t('dotenv -e .env3 -v VARIABLE=somevalue program -- exit', ['dotenv', 'program']);
  t('dotenv -- mvn exec:java -Dexec.args="-g -f"', ['dotenv', 'mvn']);
});

test('getReferencesFromScripts (cross-env)', () => {
  t('cross-env program', ['cross-env', 'program']);
  t('cross-env NODE_ENV=p program', ['cross-env', 'program']);
  t('cross-env NODE_ENV=p program subcommand', ['cross-env', 'program']);
  t('cross-env NODE_OPTIONS=--max-size=3072 program subcommand', ['cross-env', 'program']);
  t('cross-env NODE_ENV=p program -r pkg/config ./s.js -w ./s.js', ['cross-env', 'program', 'pkg']);
  t('NODE_ENV=p cross-env -- program --cache', ['cross-env', 'program']);
});

test('getReferencesFromScripts (cross-env/node)', () => {
  t('cross-env NODE_ENV=p node -r node_modules/dotenv/config ./script.js', ['cross-env', 'dotenv'], [js]);
  t('cross-env NODE_ENV=p node -r esm script.js', ['cross-env', 'esm'], [js]);
});

test('getReferencesFromScripts (npm)', () => {
  t('npm run script', []);
  t('npm run publish:latest -- --npm-tag=debug --no-push', []);
});

test('getReferencesFromScripts (npx)', () => {
  t('npx -y pkg', []);
  t('npx --yes pkg', []);
  t('npx --no commitlint --edit ${1}', ['commitlint']);
  t('npx --no -- commitlint --edit ${1}', ['commitlint']);
});

test('getReferencesFromScripts (pnpm)', () => {
  t('pnpm exec program', ['program']);
  t('pnpm run program', ['program']);
  t('pnpm program', ['program']);
  t('pnpm run program', [], [], pkgScripts);
  t('pnpm program', [], [], pkgScripts);
});

test('getReferencesFromScripts (yarn)', () => {
  t('yarn exec program', ['program']);
  t('yarn run program', ['program']);
  t('yarn program', ['program']);
  t('yarn run program', [], [], pkgScripts);
  t('yarn program', [], [], pkgScripts);
});

test('getReferencesFromScripts (bash expressions)', () => {
  t('if test "$NODE_ENV" = "production" ; then make install ; fi ', ['make']);
  t('node -e "if (NODE_ENV === \'production\'){process.exit(1)} " || make install', ['make']);
  t('if ! npx program --verbose ; then exit 1 ; fi', ['program']);
});

test('getReferencesFromScripts (multiline)', () => {
  t('#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\nnpx lint-staged', ['lint-staged']);
  t(`for S in "s"; do\n\tnpx rc@0.6.0\n\tnpx @scope/rc@0.6.0\ndone`, ['rc', '@scope/rc']);
});

test('getReferencesFromScripts (bail outs)', () => {
  t('dotenv', [], [], knownOnly);
  t('dotenv -- mvn exec:java -Dexec.args="-g -f"', [], [], knownOnly);
  t('deno install --no-check -r -f https://deno.land/x/deploy/deployctl.ts', []);
});
