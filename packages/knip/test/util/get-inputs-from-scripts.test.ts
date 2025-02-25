import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { _getInputsFromScripts } from '../../src/binaries/index.js';
import { type Input, toBinary, toConfig, toDeferResolve, toDeferResolveEntry, toDependency, toEntry } from '../../src/util/input.js';
import { join, resolve } from '../../src/util/path.js';

const cwd = resolve('fixtures/binaries');
const containingFilePath = join(cwd, 'package.json');
const pkgScripts = { cwd, manifestScriptNames: new Set(['program', 'spl:t']) };
const knownOnly = { cwd, knownBinsOnly: true };
const optional = { optional: true };

const js = toDeferResolveEntry('./script.js');
const ts = toDeferResolveEntry('./main.ts');
const req = toDeferResolve('./require.js');

type T = (script: string | string[], dependencies: Input[], options?: { cwd: string }) => void;
const t: T = (script, dependencies = [], options = { cwd }) =>
  assert.deepEqual(
    _getInputsFromScripts(script, {
      rootCwd: cwd,
      manifestScriptNames: new Set(),
      containingFilePath,
      ...options,
    }),
    dependencies
  );

test('getInputsFromScripts (unknown programs)', () => {
  t('program', [toBinary('program')]);
  t(['program', 'program'], [toBinary('program'), toBinary('program')]);
  t('program -short --long args', [toBinary('program')]);
  t('program && program2', [toBinary('program'), toBinary('program2')]);
  t('program -x && exec -y -- program2 -z', [toBinary('program'), toBinary('exec')]);
  t('program -x; exec -y -- program2', [toBinary('program'), toBinary('exec')]);
  t('program script.js -- program2', [toBinary('program')]);
  t("program '*.js' -- program2", [toBinary('program')]);
  t('program -s .', [toBinary('program')]);
  t('program command', [toBinary('program')]);
  t('adb install -r android/app/app-dev-debug.apk', [toBinary('adb')]);
  t('./wait-for-postgres.sh -h localhost -p 5433 -U dev -r 10', [toEntry('./wait-for-postgres.sh')]);
});

test('getInputsFromScripts (unknown scripts)', () => {
  t('./script.sh -r 10', [toEntry('./script.sh')]);
});

test('getInputsFromScripts (node)', () => {
  t('node script.js', [toBinary('node'), toDeferResolveEntry('script.js')]);
  t('node dist/index.js', [toBinary('node'), toDeferResolveEntry('dist/index.js')]);
  t('./script.js', [toEntry('./script.js')]);
  t('node --watch ./script.js', [toBinary('node'), js]);
  t('node script', [toBinary('node'), toDeferResolveEntry('script')]);
  t('node ./script.js build', [toBinary('node'), js]);
});

test('getInputsFromScripts (node --test)', () => {
  t('node --test --test-reporter=reporter', [toBinary('node'), toDeferResolve('reporter')]);
  t('node --test --test-reporter=spec', [toBinary('node')]);
});

test('getInputsFromScripts (node -r)', () => {
  t('node -r script.js', [toBinary('node'), toDeferResolve('script.js')]);
  t('node -r package/script', [toBinary('node'), toDeferResolve('package/script')]);
  t('node -r ./require.js script.js', [toBinary('node'), toDeferResolveEntry('script.js'), req]);
  t('node --require=pkg1 --require pkg2 script', [toBinary('node'), toDeferResolveEntry('script'), toDeferResolve('pkg1'), toDeferResolve('pkg2')]);
  t('node --import tsx ./main.ts', [toBinary('node'), toDeferResolveEntry('./main.ts'), toDeferResolve('tsx')]);
  t('node --loader ts-node/esm node_modules/pkg/bin/cli.js -c ./webpack.config.ts', [toBinary('node'), toDeferResolveEntry('node_modules/pkg/bin/cli.js'), toDeferResolve('ts-node/esm')]);
  t('node --experimental-loader ts-node/esm/transpile-only script.js', [toBinary('node'), toDeferResolveEntry('script.js'), toDeferResolve('ts-node/esm/transpile-only')]);
  t('node -r @scope/package/register ./dir', [toBinary('node'), toDeferResolveEntry('./dir'), toDeferResolve('@scope/package/register')]);
  t('node -r @scope/package/register ./dir/index', [toBinary('node'), toDeferResolveEntry('./dir/index'), toDeferResolve('@scope/package/register')]);
  t('node --inspect-brk -r pkg/register node_modules/.bin/exec --runInBand', [toBinary('node'), toBinary('exec'), toDeferResolve('pkg/register')]);
  t('node -r ts-node/register node_modules/.bin/jest', [toBinary('node'), toBinary('jest'), toDeferResolve('ts-node/register')]);
});

test('getInputsFromScripts (ts-node)', () => {
  t('ts-node --require pkg/register ./main.ts', [toBinary('ts-node'), ts, toDeferResolve('pkg/register')]);
  t('ts-node -T ./main.ts', [toBinary('ts-node'), ts]);
  t('babel-node --inspect=0.0.0.0 ./main.ts', [toBinary('babel-node'), toDeferResolve('./main.ts')]);
});

test('getInputsFromScripts (tsx)', () => {
  t('tsx ./main.ts', [toBinary('tsx'), ts]);
  t('tsx watch ./main.ts', [toBinary('tsx'), ts]);
  t('node --loader tsx ./main.ts', [toBinary('node'), ts, toDeferResolve('tsx')]);
  t('tsx main', [toBinary('tsx'), toDeferResolveEntry('main')]);
  t('tsx ./main.ts build', [toBinary('tsx'), ts]);
});

test('getInputsFromScripts (--require)', () => {
  t('program --loader tsx --test "test/*.spec.ts"', [toBinary('program')]);
  t('program --loader ldr --loader tsx --test "test/*.spec.ts"', [toBinary('program')]);
});

test('getInputsFromScripts (.bin)', () => {
  t('./node_modules/.bin/tsc --noEmit', [toBinary('tsc')]);
  t('node_modules/.bin/tsc --noEmit', [toBinary('tsc')]);
  t('$(npm bin)/tsc --noEmit', [toBinary('tsc')]);
  t('../../../scripts/node_modules/.bin/tsc --noEmit', []);
});

test('getInputsFromScripts (dotenv)', () => {
  t('dotenv program', [toBinary('dotenv'), toBinary('program')]);
  t('dotenv -- program', [toBinary('dotenv'), toBinary('program')]);
  t('dotenv -e .env3 -v VARIABLE=somevalue -- program', [toBinary('dotenv'), toBinary('program')]);
  t('dotenv -e .env3 -v VARIABLE=somevalue program -- exit', [toBinary('dotenv'), toBinary('program')]);
  t('dotenv -- mvn exec:java -Dexec.args="-g -f"', [toBinary('dotenv'), toBinary('mvn')]);
});

test('getInputsFromScripts (cross-env/env vars)', () => {
  t('cross-env program', [toBinary('cross-env'), toBinary('program')]);
  t('cross-env NODE_ENV=production program', [toBinary('cross-env'), toBinary('program')]);
  t('cross-env NODE_ENV=production program subcommand', [toBinary('cross-env'), toBinary('program')]);
  t('cross-env NODE_OPTIONS=--max-size=3072 program subcommand', [toBinary('cross-env'), toBinary('program')]);
  t('cross-env NODE_OPTIONS="--loader pkg" knex', [toBinary('cross-env'), toBinary('knex'), toDeferResolve('pkg')]);
  t('NODE_ENV=production cross-env -- program --cache', [toBinary('cross-env'), toBinary('program')]);
  t("NODE_OPTIONS='--require pkg-a --require pkg-b' program", [toBinary('program'), toDeferResolve('pkg-a'), toDeferResolve('pkg-b')]);
});

test('getInputsFromScripts (cross-env/node)', () => {
  t('cross-env NODE_ENV=production node -r pkg/config ./script.js', [toBinary('cross-env'), toBinary('node'), js, toDeferResolve('pkg/config')]);
  t('cross-env NODE_ENV=production node -r node_modules/pkg/cfg ./script.js', [toBinary('cross-env'), toBinary('node'), js, toDeferResolve('node_modules/pkg/cfg')]);
  t('cross-env NODE_ENV=production node -r esm ./script.js', [toBinary('cross-env'), toBinary('node'), js, toDeferResolve('esm')]);
});

test('getInputsFromScripts (nx)', () => {
  t('nx run myapp:build:production', [toBinary('nx')]);
  t('nx run-many -t build', [toBinary('nx')]);
  t('nx exec -- esbuild ./main.ts --outdir=build', [toBinary('nx'), toBinary('esbuild'), toDeferResolve('./main.ts')]);
});

test('getInputsFromScripts (npm)', () => {
  t('npm run script', []);
  t('npm run publish:latest -- --npm-tag=debug --no-push', []);
  t('npm exec -- vitest -c vitest.e2e.config.mts', [toBinary('vitest'), toConfig('vitest', 'vitest.e2e.config.mts')]);
});

test('getInputsFromScripts (npx)', () => {
  t('npx pkg', [toBinary('pkg')]);
  t('npx prisma migrate reset --force', [toBinary('prisma')]);
  t('npx @scope/pkg', [toDependency('@scope/pkg', optional)]);
  t('npx tsx watch main', [toBinary('tsx'), toDeferResolveEntry('main')]);
  t('npx -y pkg', []);
  t('npx --yes pkg', []);
  t('npx --no pkg --edit ${1}', [toBinary('pkg')]);
  t('npx --no -- pkg --edit ${1}', [toBinary('pkg')]);
  t('npx pkg install --with-deps', [toBinary('pkg')]);
  t('npx pkg migrate reset --force', [toBinary('pkg')]);
  t('npx pkg@1.0.0 migrate reset --force', [toDependency('pkg', optional)]);
  t('npx @scope/cli migrate reset --force', [toDependency('@scope/cli', optional)]);
  t('npx -- pkg', [toBinary('pkg')]);
  t('npx -- @scope/cli@1.0.0 migrate reset --force', [toDependency('@scope/cli', optional)]);
  t('npx retry-cli@0.6.0 -- curl --output /dev/null ', [toDependency('retry-cli', optional), toBinary('curl')]);
  t('npx --package pkg@0.6.0 -- curl --output /dev/null', [toBinary('curl'), toDependency('pkg', optional)]);
  t('npx --package @scope/pkg@0.6.0 --package pkg -- curl', [toBinary('curl'), toDependency('@scope/pkg', optional), toDependency('pkg', optional)]);
  t("npx --package=foo -c 'curl --output /dev/null'", [toDependency('foo', optional), toBinary('curl')]);
  t('npx swagger-typescript-api -p http://localhost:3030/swagger.v1.json', [toBinary('swagger-typescript-api')]);
  t('npx swagger-typescript-api -- -p http://localhost:3030/swagger.v1.json', [toBinary('swagger-typescript-api')]);
  t('npx tsx main', [toBinary('tsx'), toDeferResolveEntry('main')]);
  t('npx tsx ./main.ts build', [toBinary('tsx'), ts]);
  t('npx tsx ./main.ts -- build', [toBinary('tsx'), ts]);
});

test('getInputsFromScripts (bunx/bun x)', () => {
  t('bunx pkg', [toDependency('pkg', optional)]);
  t('bunx cowsay "Hello world!"', [toDependency('cowsay', optional)]);
  t('bunx my-cli --foo bar', [toDependency('my-cli', optional)]);
  t('bun x pkg', [toDependency('pkg', optional)]);
});

test('getInputsFromScripts (pnpm)', () => {
  t('pnpm exec program', [toBinary('program')]);
  t('pnpm run program', []);
  t('pnpm program', [toBinary('program')]);
  t('pnpm run program', [], pkgScripts);
  t('pnpm program', [], pkgScripts);
  t('pnpm dlx pkg', [toDependency('pkg', optional)]);
  t('pnpm --package=pkg-a dlx pkg', [toDependency('pkg', optional), toDependency('pkg-a', optional)]);
  t('pnpm --recursive --parallel test -- --sequence.seed=1700316221712', []);
  t('pnpm program script.js', [], pkgScripts);
  t('pnpm --silent program script.js', [], pkgScripts);
  t('pnpm --silent run program script.js', [], pkgScripts);
});

test('getInputsFromScripts (pnpx/pnpm dlx)', () => {
  t('pnpx pkg', [toDependency('pkg', optional)]);
  const inputs = [toDependency('cowsay', optional), toDependency('lolcatjs', optional), toBinary('echo'), toBinary('cowsay'), toBinary('lolcatjs')];
  t('pnpx --package cowsay --package lolcatjs -c \'echo "hi pnpm" | cowsay | lolcatjs\'', inputs);
  t('pnpm --package cowsay --package lolcatjs -c dlx \'echo "hi pnpm" | cowsay | lolcatjs\'', inputs);
});

test('getInputsFromScripts (yarn)', () => {
  t('yarn exec program', [toBinary('program')]);
  t('yarn run program', [toBinary('program', optional)]);
  t('yarn program', [toBinary('program')]);
  t('yarn run program', [], pkgScripts);
  t('yarn program', [], pkgScripts);
  t('yarn node script.js', [toBinary('node'), toDeferResolveEntry('script.js')]);
});

test('getInputsFromScripts (yarn dlx)', () => {
  t('yarn dlx pkg', [toBinary('pkg', optional)]);
  t('yarn dlx -p typescript -p ts-node ts-node -T -e "console.log(\'hello!\')"', [toDependency('typescript', optional), toDependency('ts-node', optional), toBinary('ts-node', optional)]);
  t('yarn dlx -p ts-node ts-node ./main.ts', [toDependency('ts-node', optional), toBinary('ts-node', optional), ts]);
  t('yarn --package=pkg-a -p pkg-b dlx pkg', [toDependency('pkg-a', optional), toDependency('pkg-b', optional), toBinary('pkg', optional)]);
});

test('getInputsFromScripts (rollup)', () => {
  t('rollup --watch --watch.onEnd="node ./script.js"', [toBinary('rollup'), toBinary('node'), js]);
  t('rollup -p ./require.js', [toBinary('rollup'), req]);
  t('rollup --plugin @rollup/plugin-node-resolve', [toBinary('rollup'), toDeferResolve('@rollup/plugin-node-resolve')]);
  t('rollup --configPlugin @rollup/plugin-typescript', [toBinary('rollup'), toDeferResolve('@rollup/plugin-typescript')]);
});

test('getInputsFromScripts (execa)', () => {
  t('execa --quiet ./script.js', [toBinary('execa'), toDeferResolve('./script.js')]);
  t('npx --yes execa --quiet ./script.js', [toDeferResolve('./script.js')]);
});

test('getInputsFromScripts (zx)', () => {
  t('zx --quiet script.js', [toBinary('zx'), toDeferResolve('script.js')]);
  t('npx --yes zx --quiet script.js', [toDeferResolve('script.js')]);
});

test('getInputsFromScripts (c8)', () => {
  t('c8 node script.js', [toBinary('c8'), toBinary('node'), toDeferResolveEntry('script.js')]);
  t('c8 npm test', [toBinary('c8')]);
  t('c8 check-coverage --lines 95 --per-file npm test', [toBinary('c8')]);
  t("c8 --reporter=lcov --reporter text mocha 'test/**/*.spec.js'", [toBinary('c8'), toBinary('mocha')]);
  t('c8 --reporter=lcov --reporter text node --test --test-reporter=@org/rep', [toBinary('c8'), toBinary('node'), toDeferResolve('@org/rep')]);
});

test('getInputsFromScripts (nodemon)', () => {
  t('nodemon --require dotenv/config ./script.js --watch ./script.js', [toBinary('nodemon'), js, toDeferResolve('dotenv/config')]);
  t("nodemon --exec 'ts-node --esm' ./main.ts | pino-pretty", [toBinary('nodemon'), ts, toBinary('ts-node'), toBinary('pino-pretty')]);
  t('nodemon script.js', [toBinary('nodemon'), toDeferResolveEntry('script.js')]);
});

test('getInputsFromScripts (double-dash)', () => {
  t('dotenvx run --convention=nextjs -- tsx watch src/index.ts', [toBinary('dotenvx'), toBinary('tsx'), toDeferResolveEntry('src/index.ts')]);
});

test('getInputsFromScripts (bash expressions)', () => {
  t('if test "$NODE_ENV" = "production" ; then make install ; fi ', [toBinary('make')]);
  t('node -e "if (NODE_ENV === \'production\'){process.exit(1)} " || make install', [toBinary('node'), toBinary('make')]);
  t('if ! npx pkg --verbose ; then exit 1 ; fi', [toBinary('pkg'), toBinary('exit')]);
  t('exec < /dev/tty && node_modules/.bin/cz --hook || true', [toBinary('exec'), toBinary('cz'), toBinary('true')]);
});

test('getInputsFromScripts (bash expansion)', () => {
  t('var=$(node ./script.js)', [toBinary('node'), js]);
  t('var=`node ./script.js`;var=`node ./require.js`', [toBinary('node'), js, toBinary('node'), js, toBinary('node'), toDeferResolveEntry('./require.js')]);
});

test('getInputsFromScripts (multiline)', () => {
  t('#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\nnpx lint-staged', [toBinary('lint-staged')]);
  t(`for S in "s"; do\n\tnpx rc@0.6.0\n\tnpx @scope/rc@0.6.0\ndone`, [toDependency('rc', optional), toDependency('@scope/rc', optional)]);
});

test('getInputsFromScripts (bail outs)', () => {
  t('curl', [], knownOnly);
  t('program -- mvn exec:java -Dexec.args="-g -f"', [], knownOnly);
});

test('getInputsFromScripts (ignore parse error)', () => {
  t('node --maxWorkers="$(node -e \'process.stdout.write(os.cpus().length.toString())\')"', []); // unclosed '
});

test('getInputsFromScripts (config)', () => {
  t('tsc -p tsconfig.app.json', [toBinary('tsc'), toConfig('typescript', 'tsconfig.app.json')]);
  t('tsup -c tsup.server.json', [toBinary('tsup'), toConfig('tsup', 'tsup.server.json')]);
});
