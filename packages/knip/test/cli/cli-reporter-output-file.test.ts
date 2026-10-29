import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { after, before, test } from 'node:test';
import { join } from '../../src/util/path.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/prettier');
const reporterCwd = resolve('fixtures/cli-reporter');

const symbolsOutput = `Unused devDependencies (1)
prettier  package.json:5:6
Unlisted dependencies (4)
@company/prettier-config  package.json
prettier-plugin-xml       prettier.config.js
prettier-plugin-astro     prettier.config.js
prettier-plugin-java      prettier.config.js`;

let outDir: string;

before(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'knip-output-file-'));
});

after(async () => {
  await rm(outDir, { recursive: true, force: true });
});

test('knip --reporter symbols --reporter json --output-file json=path', async () => {
  const outputFile = join(outDir, 'knip.json');
  const result = exec(`knip --reporter symbols --reporter json --output-file json=${outputFile}`, { cwd });

  assert.equal(result.stdout.replace(/ +$/gm, ''), symbolsOutput);

  const json = JSON.parse(await readFile(outputFile, 'utf8'));
  assert.equal(json.issues.length, 2);
  assert.deepEqual(json.issues.find((entry: { file: string }) => entry.file === 'package.json').devDependencies, [
    { name: 'prettier', line: 5, col: 6, pos: 81 },
  ]);
});

test('knip --reporter sarif --output-file path (single reporter, no prefix)', async () => {
  const outputFile = join(outDir, 'knip.sarif');
  const result = exec(`knip --reporter sarif --output-file ${outputFile}`, { cwd });

  assert.equal(result.stdout, '');
  assert.equal(result.status, 1);

  const sarif = JSON.parse(await readFile(outputFile, 'utf8'));
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs[0].results.length, 5);
});

test('knip --reporter markdown --output-file path creates parent directories', async () => {
  const outputFile = join(outDir, 'nested', 'dir', 'knip.md');
  const result = exec(`knip --reporter markdown --output-file ${outputFile}`, { cwd });

  assert.equal(result.stdout, '');

  const markdown = await readFile(outputFile, 'utf8');
  assert.match(markdown, /^# Knip report\n/);
  assert.match(markdown, /## Unused devDependencies \(1\)/);
});

test('knip --output-file path with multiple reporters is an error', () => {
  const result = exec(`knip --reporter symbols --reporter json --output-file ${join(outDir, 'x.json')}`, { cwd });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /--output-file/);
  assert.match(result.stderr, /symbols, json/);
});

test('knip --output-file reporter=path with unknown reporter is an error', () => {
  const result = exec(`knip --reporter json --output-file nope=${join(outDir, 'x.json')}`, { cwd });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /nope/);
});

test('knip --reporter ./summary.ts --output-file path (custom reporter using options.write)', async () => {
  const outputFile = join(outDir, 'summary.txt');
  const result = exec(`knip --reporter ./summary.ts --output-file ./summary.ts=${outputFile}`, { cwd: reporterCwd });

  assert.equal(result.stdout, '');
  assert.equal(await readFile(outputFile, 'utf8'), 'hi from summary reporter\n');
});

test('knip --reporter ./index.ts --output-file path (custom reporter using console.log writes no file)', async () => {
  const outputFile = join(outDir, 'ignored.txt');
  const result = exec(`knip --reporter ./index.ts --output-file ./index.ts=${outputFile}`, { cwd: reporterCwd });

  assert.equal(result.stdout, 'hi from ts reporter');
  await assert.rejects(readFile(outputFile), { code: 'ENOENT' });
});

test('knip --reporter ./summary.ts (custom reporter using options.write to stdout)', () => {
  const result = exec('knip --reporter ./summary.ts', { cwd: reporterCwd });

  assert.equal(result.stdout, 'hi from summary reporter');
});
