import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path/posix';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./benchmark-native.js', import.meta.url));

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'knip-benchmark-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  writeFileSync(join(directory, 'package.json'), '{}');
  const baseline = join(directory, 'baseline.mjs');
  const candidate = join(directory, 'candidate.mjs');
  const output = join(directory, 'result.json');
  const run = (extra = [], flags = []) =>
    spawnSync(
      process.execPath,
      [script, '--baseline', baseline, '--candidate', candidate, '--output', output, ...extra, '--', ...flags],
      { encoding: 'utf8' }
    );
  return { directory, baseline, candidate, output, run };
}

test('alternates pairs, excludes warmup, checks exact bytes, and isolates each cache mode', t => {
  const f = fixture(t);
  const log = join(f.directory, 'calls.jsonl');
  const source = `
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const cache = args[args.indexOf('--cache-location') + 1];
appendFileSync(${JSON.stringify(log)}, JSON.stringify({ engine: import.meta.url, cache, hit: existsSync(cache + '/marker'), args }) + '\\n');
if (args.includes('--cache')) {
  mkdirSync(cache, { recursive: true });
  writeFileSync(cache + '/marker', 'cached');
}
process.stdout.write(Buffer.from([0, 255, 10]));
process.stderr.write(Buffer.from([128, 13, 10]));
process.exitCode = 1;
`;
  writeFileSync(f.baseline, source);
  writeFileSync(f.candidate, source);
  for (const mode of ['none', 'cold', 'warm']) {
    const result = f.run(['--directory', f.directory, '--cache-mode', mode], ['--include', 'exports']);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(readFileSync(f.output, 'utf8'));
    assert.equal(report.parity, true);
    assert.equal(report.pairs.length, 6);
    const calls = readFileSync(log, 'utf8').trim().split('\n');
    const samples = { baseline: [], candidate: [] };
    for (let index = 0; index < report.pairs.length; index++) {
      const pair = report.pairs[index];
      const order = index % 2 === 0 ? ['baseline', 'candidate'] : ['candidate', 'baseline'];
      assert.deepEqual(pair.order, order);
      assert.equal(pair.warmup, index === 0);
      assert.equal(pair.parity, true);
      for (let position = 0; position < 2; position++) {
        const engine = order[position];
        const call = JSON.parse(calls[index * 2 + position]);
        assert.ok(call.engine.endsWith(`/${engine}.mjs`));
        assert.equal(call.hit, mode === 'warm' && index > 0);
        assert.equal(call.args.includes('--cache'), mode !== 'none');
        assert.deepEqual(call.args.slice(-2), ['--include', 'exports']);
        assert.equal(pair[engine].exitCode, 1);
        assert.equal(pair[engine].stdout.bytes, 3);
        assert.equal(
          pair[engine].stdout.sha256,
          createHash('sha256')
            .update(Buffer.from([0, 255, 10]))
            .digest('hex')
        );
        assert.equal(
          pair[engine].stderr.sha256,
          createHash('sha256')
            .update(Buffer.from([128, 13, 10]))
            .digest('hex')
        );
        if (index > 0) samples[engine].push(pair[engine].elapsedMs);
      }
    }
    assert.notEqual(report.cacheLocations.baseline, report.cacheLocations.candidate);
    assert.equal(existsSync(report.cacheLocations.baseline), false);
    for (const engine of ['baseline', 'candidate']) {
      const times = samples[engine].sort((a, b) => a - b);
      const stats = report.statistics[engine];
      assert.equal(stats.runs, 5);
      assert.equal(stats.minMs, times[0]);
      assert.equal(stats.maxMs, times[4]);
      assert.equal(stats.medianMs, times[2]);
      let sum = 0;
      for (const time of times) sum += time;
      assert.ok(Math.abs(stats.meanMs - sum / 5) < 1e-9);
    }
    assert.equal(report.speedup.mean, report.statistics.baseline.meanMs / report.statistics.candidate.meanMs);
    rmSync(f.output);
    rmSync(log);
  }
});

test('fails closed for byte differences, exit differences, errors, signals, and a late divergence', t => {
  const f = fixture(t);
  const cases = [
    ['process.stdout.write(Buffer.from([255]));', 'process.stdout.write(Buffer.from([254]));'],
    ["process.stderr.write('issue\\n');", "process.stderr.write('issue\\r\\n');"],
    ['process.exitCode = 0;', 'process.exitCode = 1;'],
    ['process.exitCode = 2;', 'process.exitCode = 2;'],
    ['process.exitCode = 7;', 'process.exitCode = 7;'],
    ["process.kill(process.pid, 'SIGTERM');", "process.kill(process.pid, 'SIGTERM');"],
  ];
  const counter = join(f.directory, 'counter');
  cases.push([
    "process.stdout.write('same');",
    `import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const counter = ${JSON.stringify(counter)};
const count = existsSync(counter) ? Number(readFileSync(counter)) + 1 : 1;
writeFileSync(counter, String(count));
process.stdout.write(count === 6 ? 'different' : 'same');`,
  ]);
  for (const [baseline, candidate] of cases) {
    writeFileSync(f.baseline, baseline);
    writeFileSync(f.candidate, candidate);
    const result = f.run(['--directory', f.directory]);
    assert.equal(result.status, 1, result.stderr);
    const report = JSON.parse(readFileSync(f.output, 'utf8'));
    assert.equal(report.parity, false);
    assert.equal(report.speedup, undefined);
    assert.equal(report.statistics, undefined);
    assert.ok(report.failure);
    assert.equal(report.pairs.at(-1).parity, false);
    assert.ok(report.failure.outputs.baseline);
    rmSync(f.output);
  }
});

test('requires enough runs and rejects flags that undermine measured read-only parity', t => {
  const f = fixture(t);
  writeFileSync(f.baseline, '');
  writeFileSync(f.candidate, '');
  for (const runs of ['0', '4', '5.5', 'NaN', 'Infinity', '5oops']) {
    const result = f.run(['--directory', f.directory, '--runs', runs]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /runs/);
  }
  for (const flag of [
    '--no-exit-code',
    '--performance',
    '--memory',
    '-u',
    '--cache',
    '--cache-location=/tmp/unsafe',
    '--fix',
    '-nf',
    '--watch',
    '--help',
    '--directory=/tmp',
  ]) {
    const result = f.run(['--directory', f.directory], [flag]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /passthrough/);
  }
});

test('generates deterministic reachable leaves, barrels, and namespaces without repo files', t => {
  const f = fixture(t);
  const source = `
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
assert.deepEqual(pkg.knip.entry, ['index.ts']);
assert.deepEqual(pkg.knip.project, ['index.ts', 'src/**/*.ts']);
assert.equal(pkg.knip.vite, false);
assert.equal(pkg.knip.vitest, false);
assert.match(readFileSync('index.ts', 'utf8'), /modules.group0.used0/);
assert.match(readFileSync('src/index.ts', 'utf8'), /export \\* as group0/);
assert.match(readFileSync('src/group-0/barrel-2.ts', 'utf8'), /barrel-1.js/);
assert.match(readFileSync('src/group-0/leaf-0.ts', 'utf8'), /unused0/);
process.stdout.write(readFileSync('package.json'));
for (const file of readdirSync('src', { recursive: true }).sort()) {
  if (file.endsWith('.ts')) process.stdout.write(readFileSync('src/' + file));
}
process.exitCode = 1;
`;
  writeFileSync(f.baseline, source);
  writeFileSync(f.candidate, source);
  let hash;
  for (let iteration = 0; iteration < 2; iteration++) {
    const result = f.run(['--generate', '--files', '3', '--fanout', '2', '--depth', '3']);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(readFileSync(f.output, 'utf8'));
    assert.equal(report.workload.kind, 'synthetic');
    assert.equal(report.workload.leafFiles, 3);
    assert.equal(report.workload.sourceFiles, 11);
    assert.equal(existsSync(report.workload.directory), false);
    const current = report.pairs[0].baseline.stdout.sha256;
    if (hash) assert.equal(current, hash);
    hash = current;
    rmSync(f.output);
  }
});

test('edit mode changes one source per pair, reuses caches, and restores the original source', t => {
  const f = fixture(t);
  const edited = join(f.directory, 'index.ts');
  const original = 'export const value = 1;\n';
  writeFileSync(edited, original);
  const source = `
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const args = process.argv.slice(2);
const cache = args[args.indexOf('--cache-location') + 1];
const bytes = readFileSync('index.ts');
const marker = cache + '/previous';
if (existsSync(marker)) assert.equal(bytes.length, Number(readFileSync(marker)) + 1);
mkdirSync(cache, { recursive: true });
writeFileSync(marker, String(bytes.length));
process.stdout.write(bytes);
`;
  writeFileSync(f.baseline, source);
  writeFileSync(f.candidate, source);
  const result = f.run(['--directory', f.directory, '--cache-mode', 'edit', '--edit-file', 'index.ts']);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(readFileSync(f.output, 'utf8'));
  assert.equal(report.parity, true);
  for (let index = 0; index < report.pairs.length; index++) {
    const pair = report.pairs[index];
    assert.equal(pair.edit.bytes, Buffer.byteLength(original) + index);
    assert.deepEqual(pair.baseline.stdout, pair.edit);
    assert.deepEqual(pair.candidate.stdout, pair.edit);
  }
  assert.equal(readFileSync(edited, 'utf8'), original);
  assert.ok(report.statistics.baseline.standardDeviationMs >= 0);
  assert.ok(report.speedup.pairedMedian > 0);
});

test('edit mode restores its source after parity failure and rejects missing edit configuration', t => {
  const f = fixture(t);
  const edited = join(f.directory, 'index.ts');
  writeFileSync(edited, 'original\n');
  writeFileSync(f.baseline, "import { readFileSync } from 'node:fs'; process.stdout.write(readFileSync('index.ts'));");
  writeFileSync(
    f.candidate,
    "import { readFileSync } from 'node:fs'; const source = readFileSync('index.ts', 'utf8'); process.stdout.write(source.length > 9 ? 'different' : source);"
  );
  const result = f.run(['--directory', f.directory, '--cache-mode', 'edit', '--edit-file', 'index.ts']);
  assert.equal(result.status, 1);
  assert.equal(readFileSync(edited, 'utf8'), 'original\n');
  const report = JSON.parse(readFileSync(f.output, 'utf8'));
  assert.equal(report.failure.pair, 1);
  assert.equal(report.speedup, undefined);
  rmSync(f.output);
  const missing = f.run(['--directory', f.directory, '--cache-mode', 'edit']);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /requires --edit-file/);
});
