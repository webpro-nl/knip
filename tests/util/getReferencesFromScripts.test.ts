import assert from 'node:assert/strict';
import test from 'node:test';
import { _getDependenciesFromScripts } from '../../src/binaries/index.js';
import { join, resolve } from '../../src/util/path.js';

const cwd = resolve('tests/fixtures/binaries');

const js = join(cwd, 'script.js');
const ts = join(cwd, 'main.ts');
const req = join(cwd, 'require.js');
const index = join(cwd, 'dir', 'index.js');

const pkgScripts = { cwd, manifest: { scripts: { program: '' } } };
const knownOnly = { cwd, knownGlobalsOnly: true };

type T = (script: string | string[], dependencies: string[], options?: { cwd: string }) => void;
const t: T = (script, dependencies = [], options = { cwd }) =>
  assert.deepEqual(_getDependenciesFromScripts(script, options), dependencies);

test('getReferencesFromScripts', () => {
  t('program', ['bin:program']);
  t(['program', 'program'], ['bin:program']);
  t('program -short --long args', ['bin:program']);
  t('program && program2', ['bin:program', 'bin:program2']);
  t('program -x && exec -y -- program2 -z', ['bin:program', 'bin:exec']);
  t('program -x; exec -y -- program2', ['bin:program', 'bin:exec']);
  t('program script.js -- program2', ['bin:program']);
  t("program '*.js' -- program2", ['bin:program']);
  t('program -s .', ['bin:program']);
  t('program command', ['bin:program']);
});

test('getReferencesFromScripts (node)', () => {
  t('node script.js', [js]);
  t('node -r script.js', [js]);
  t('node -r package/script', ['package']);
  t('node -r ./require.js script.js', [js, req]);
  t('node --require=pkg1 --require pkg2 script', [js, 'pkg1', 'pkg2']);
  t('node --experimental-loader ts-node/esm/transpile-only script.js', [js, 'ts-node']);
  t('node -r @scope/package/register ./dir', [index, '@scope/package']);
  t('node dist/index.js', []);
});

test('getReferencesFromScripts (ts-node/tsx)', () => {
  t('ts-node --require pkg/register main.ts', ['bin:ts-node', ts, 'pkg']);
  t('tsx ./main.ts', ['bin:tsx', ts]);
  t('tsx watch ./main.ts', ['bin:tsx', ts]);
  t('node --loader tsx ./main.ts', [ts, 'tsx']);
  t('npx tsx main', ['tsx', ts]);
  t('babel-node --inspect=0.0.0.0 ./main.ts', ['bin:babel-node', ts]);
});

test('getReferencesFromScripts (--require)', () => {
  t('nodemon --require dotenv/config ./script.js --watch ./script.js', ['bin:nodemon', js, 'dotenv']);
  t('program --loader tsx --test "test/*.spec.ts"', ['bin:program', 'tsx']);
  t('program --loader ldr --loader tsx --test "test/*.spec.ts"', ['bin:program', 'ldr', 'tsx']);
});

test('getReferencesFromScripts (.bin)', () => {
  t('./node_modules/.bin/tsc --noEmit', ['bin:tsc']);
  t('node_modules/.bin/tsc --noEmit', ['bin:tsc']);
  t('$(npm bin)/tsc --noEmit', ['bin:tsc']);
  t('../../../scripts/node_modules/.bin/tsc --noEmit', []);
});

test('getReferencesFromScripts (dotenv)', () => {
  t('dotenv program', ['bin:dotenv', 'bin:program']);
  t('dotenv -- program', ['bin:dotenv', 'bin:program']);
  t('dotenv -e .env3 -v VARIABLE=somevalue program -- exit', ['bin:dotenv', 'bin:program']);
  t('dotenv -- mvn exec:java -Dexec.args="-g -f"', ['bin:dotenv', 'bin:mvn']);
});

test('getReferencesFromScripts (cross-env)', () => {
  t('cross-env program', ['bin:cross-env', 'bin:program']);
  t('cross-env NODE_ENV=production program', ['bin:cross-env', 'bin:program']);
  t('cross-env NODE_ENV=production program subcommand', ['bin:cross-env', 'bin:program']);
  t('cross-env NODE_OPTIONS=--max-size=3072 program subcommand', ['bin:cross-env', 'bin:program']);
  t('cross-env NODE_ENV=production program -r pkg/config ./s.js -w ./s.js', ['bin:cross-env', 'bin:program', 'pkg']);
  t('NODE_ENV=production cross-env -- program --cache', ['bin:cross-env', 'bin:program']);
});

test('getReferencesFromScripts (cross-env/node)', () => {
  t('cross-env NODE_ENV=production node -r node_modules/dotenv/config ./script.js', ['bin:cross-env', js, 'dotenv']);
  t('cross-env NODE_ENV=production node -r esm script.js', ['bin:cross-env', js, 'esm']);
});

test('getReferencesFromScripts (npm)', () => {
  t('npm run script', ['bin:npm']);
  t('npm run publish:latest -- --npm-tag=debug --no-push', ['bin:npm']);
});

test('getReferencesFromScripts (npx)', () => {
  t('npx pkg', ['pkg']);
  t('npx prisma migrate reset --force', ['prisma']);
  t('npx @scope/pkg', ['@scope/pkg']);
  t('npx tsx watch main', ['tsx', ts]);
  t('npx -y pkg', []);
  t('npx --yes pkg', []);
  t('npx --no pkg --edit ${1}', ['pkg']);
  t('npx --no -- pkg --edit ${1}', ['bin:pkg']);
  t('npx pkg install --with-deps', ['pkg']);
  t('npx pkg migrate reset --force', ['pkg']);
  t('npx pkg@0.6.0 -- curl --output /dev/null', ['pkg', 'bin:curl']);
  t('npx @scope/pkg@0.6.0 -- curl', ['@scope/pkg', 'bin:curl']);
});

test('getReferencesFromScripts (pnpm)', () => {
  t('pnpm exec program', ['bin:program']);
  t('pnpm run program', []);
  t('pnpm program', ['bin:program']);
  t('pnpm run program', [], pkgScripts);
  t('pnpm program', [], pkgScripts);
  t('pnpm dlx pkg', []);
  t('pnpm --package=pkg-a dlx pkg', []);
});

test('getReferencesFromScripts (yarn)', () => {
  t('yarn exec program', ['bin:program']);
  t('yarn run program', ['bin:program']);
  t('yarn program', ['bin:program']);
  t('yarn run program', [], pkgScripts);
  t('yarn program', [], pkgScripts);
  t('yarn dlx pkg', []);
  t('yarn --package=pkg-a -p pkg-b dlx pkg', []);
  t('yarn node script.js', [js]);
});

test('getReferencesFromScripts (rollup)', () => {
  t('rollup --watch --watch.onEnd="node script.js"', ['bin:rollup', js]);
  t('rollup -p ./require.js', ['bin:rollup', req]);
  t('rollup --plugin @rollup/plugin-node-resolve', ['bin:rollup', '@rollup/plugin-node-resolve']);
  t('rollup --configPlugin @rollup/plugin-typescript', ['bin:rollup', '@rollup/plugin-typescript']);
});

test('getReferencesFromScripts (execa)', () => {
  t('execa --quiet script.js', ['bin:execa', js]);
  t('npx --yes execa --quiet script.js', [js]);
});

test('getReferencesFromScripts (zx)', () => {
  t('zx --quiet script.js', ['bin:zx', js]);
  t('npx --yes zx --quiet script.js', [js]);
});

test('getReferencesFromScripts (bash expressions)', () => {
  t('if test "$NODE_ENV" = "production" ; then make install ; fi ', ['bin:make']);
  t('node -e "if (NODE_ENV === \'production\'){process.exit(1)} " || make install', ['bin:make']);
  t('if ! npx pkg --verbose ; then exit 1 ; fi', ['pkg', 'bin:exit']);
});

test('getReferencesFromScripts (bash expansion)', () => {
  t('var=$(node ./script.js)', [js]);
  t('var=`node ./script.js`;var=`node ./require.js`', [js, req]);
});

test('getReferencesFromScripts (multiline)', () => {
  t('#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\nnpx lint-staged', ['lint-staged']);
  t(`for S in "s"; do\n\tnpx rc@0.6.0\n\tnpx @scope/rc@0.6.0\ndone`, ['rc', '@scope/rc']);
});

test('getReferencesFromScripts (bail outs)', () => {
  t('dotenv', [], knownOnly);
  t('dotenv -- mvn exec:java -Dexec.args="-g -f"', [], knownOnly);
  t('deno install --no-check -r -f https://deno.land/x/deploy/deployctl.ts', []);
});

test('getReferencesFromScripts (ignore parse error)', () => {
  t('node --maxWorkers="$(node -e \'process.stdout.write(os.cpus().length.toString())\')"', []); // unclosed '
});
