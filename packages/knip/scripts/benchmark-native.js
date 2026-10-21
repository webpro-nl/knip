#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { arch, cpus, loadavg, platform, release, tmpdir } from 'node:os';
import { join, resolve } from 'node:path/posix';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const help = `Usage: node packages/knip/scripts/benchmark-native.js [options] -- [knip flags]

  --baseline PATH     Frozen compiled CLI (required)
  --candidate PATH    Compiled CLI (default: ../dist/cli.js relative to this script)
  --directory PATH    Existing fixture or repository (default: current directory)
  --generate          Create a deterministic temporary synthetic graph instead
  --files INTEGER     Synthetic leaf modules (default: 1000; barrels are additional)
  --fanout INTEGER    Leaves per group (default: 10)
  --depth INTEGER     Re-export barrel layers per group (default: 4)
  --runs INTEGER      Measured pairs after one discarded warmup pair (default: 5, minimum: 5)
  --runtime node|bun  Runtime for both CLI processes (default: node)
  --cache-mode MODE   none, cold, warm, or edit (default: none)
  --edit-file PATH    Relative source file for edit mode (generated graphs use their first leaf)
  --output PATH       New JSON results file (required; never overwrites)
  --help              Show this help

Each pair alternates execution order and requires byte-identical stdout/stderr and
equal exit codes of 0 or 1. Any error, signal, or mismatch fails without speedup.
Defaults: --no-progress --reporter json. A passthrough reporter overrides JSON.
Profiling, fix, watch, cache overrides, and exit masking flags are rejected.
Timings include process startup and output capture; setup and hashing are excluded.
Knip and Jiti caches are separate per engine in disposable temporary directories.
Cold deletes them before every invocation; warm retains them after warmup; none
disables them. Node's compile cache is disabled. OS/runtime caches are not flushed.
Edit mode appends whitespace to one source before each measured pair and restores
its contents and timestamps afterward. Use a disposable checkout for edit mode.
Synthetic results are graph stress measurements, not real-repository throughput.
Use settled builds and an idle machine for performance conclusions. Configs and
preprocessors execute normally and are responsible for their own side effects.
`;

const engines = ['baseline', 'candidate'];
const forbidden = new Set([
  '--cache',
  '--cache-location',
  '--no-cache',
  '--no-exit-code',
  '--performance',
  '--performance-fn',
  '--memory',
  '--memory-realtime',
  '--duration',
  '--debug',
  '--trace',
  '--trace-dependency',
  '--trace-export',
  '--trace-file',
  '--fix',
  '--fix-type',
  '--format',
  '--allow-remove-files',
  '--watch',
  '--help',
  '--version',
  '--directory',
]);

function integer(value, option, minimum) {
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < minimum) {
    throw new Error(`--${option} must be an integer >= ${minimum}`);
  }
  return number;
}

function options() {
  const argv = process.argv.slice(2);
  const separator = argv.indexOf('--');
  const passthrough = separator < 0 ? [] : argv.slice(separator + 1);
  const { values } = parseArgs({
    args: separator < 0 ? argv : argv.slice(0, separator),
    options: {
      baseline: { type: 'string' },
      candidate: { type: 'string', default: fileURLToPath(new URL('../dist/cli.js', import.meta.url)) },
      directory: { type: 'string' },
      generate: { type: 'boolean', default: false },
      files: { type: 'string', default: '1000' },
      fanout: { type: 'string', default: '10' },
      depth: { type: 'string', default: '4' },
      runs: { type: 'string', default: '5' },
      runtime: { type: 'string', default: 'node' },
      'cache-mode': { type: 'string', default: 'none' },
      'edit-file': { type: 'string' },
      output: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) return;
  if (!values.baseline || !values.output) throw new Error('--baseline and --output are required');
  if (values.generate && values.directory) throw new Error('--generate and --directory are mutually exclusive');
  if (
    !values.generate &&
    argv.slice(0, separator < 0 ? argv.length : separator).some(arg => /^--(files|fanout|depth)(=|$)/.test(arg))
  ) {
    throw new Error('--files, --fanout, and --depth require --generate');
  }
  if (values.runtime !== 'node' && values.runtime !== 'bun') throw new Error('--runtime must be node or bun');
  if (!['none', 'cold', 'warm', 'edit'].includes(values['cache-mode']))
    throw new Error('--cache-mode must be none, cold, warm, or edit');
  if (values['edit-file'] && values['cache-mode'] !== 'edit') throw new Error('--edit-file requires edit mode');
  if (values['cache-mode'] === 'edit' && !values.generate && !values['edit-file'])
    throw new Error('Edit mode requires --edit-file or --generate');
  for (const arg of passthrough) {
    const equal = arg.indexOf('=');
    const flag = equal < 0 ? arg : arg.slice(0, equal);
    if (forbidden.has(flag)) {
      throw new Error(`Unsupported benchmark passthrough flag: ${flag}`);
    }
    if (flag.startsWith('-') && !flag.startsWith('--')) {
      for (const short of flag.slice(1)) {
        if ('udfFwDhV'.includes(short)) throw new Error(`Unsupported benchmark passthrough flag: -${short}`);
        if ('ctW'.includes(short)) break;
      }
    }
  }
  if (
    process.env.NODE_V8_COVERAGE ||
    /--(?:[\w-]*(?:prof|trace|inspect)|require|import|loader|experimental-loader)\b/.test(
      process.env.NODE_OPTIONS ?? ''
    )
  ) {
    throw new Error('Remove profiling, tracing, coverage, or loader instrumentation from the runtime environment');
  }
  const cli = { baseline: resolve(values.baseline), candidate: resolve(values.candidate) };
  for (const engine of engines) {
    if (!statSync(cli[engine], { throwIfNoEntry: false })?.isFile())
      throw new Error(`${engine} is not a CLI file: ${cli[engine]}`);
  }
  return {
    cli,
    directory: resolve(values.directory ?? '.'),
    generate: values.generate,
    files: integer(values.files, 'files', 1),
    fanout: integer(values.fanout, 'fanout', 1),
    depth: integer(values.depth, 'depth', 1),
    runs: integer(values.runs, 'runs', 5),
    runtime: values.runtime,
    cacheMode: values['cache-mode'],
    editFile: values['edit-file'],
    output: resolve(values.output),
    passthrough,
  };
}

function generate(directory, settings) {
  mkdirSync(join(directory, 'src'), { recursive: true });
  const knip = { entry: ['index.ts'], project: ['index.ts', 'src/**/*.ts'], includeEntryExports: true };
  const pluginNames = [];
  for (const entry of readdirSync(new URL('../src/plugins', import.meta.url), { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) pluginNames.push(entry.name);
  }
  for (const name of pluginNames.sort()) knip[name] = false;
  writeFileSync(
    join(directory, 'package.json'),
    `${JSON.stringify({ name: 'knip-synthetic-graph', private: true, type: 'module', knip }, null, 2)}\n`
  );
  const entry = ["import * as modules from './src/index.js';"];
  const root = [];
  let sourceFiles = 2;
  for (let start = 0, group = 0; start < settings.files; start += settings.fanout, group++) {
    const groupDirectory = join(directory, 'src', `group-${group}`);
    mkdirSync(groupDirectory);
    const exports = [];
    for (let index = start; index < Math.min(start + settings.fanout, settings.files); index++) {
      writeFileSync(
        join(groupDirectory, `leaf-${index}.ts`),
        `export const used${index} = (value: number): number => value + ${index};\n` +
          `export const unused${index} = (value: number): number => value - ${index};\n`
      );
      exports.push(`export * from './leaf-${index}.js';`);
      entry.push(`console.log(modules.group${group}.used${index}(${index}));`);
      sourceFiles++;
    }
    for (let layer = 0; layer < settings.depth; layer++) {
      writeFileSync(
        join(groupDirectory, `barrel-${layer}.ts`),
        layer === 0 ? `${exports.join('\n')}\n` : `export * from './barrel-${layer - 1}.js';\n`
      );
      sourceFiles++;
    }
    root.push(`export * as group${group} from './group-${group}/barrel-${settings.depth - 1}.js';`);
  }
  writeFileSync(join(directory, 'index.ts'), `${entry.join('\n')}\n`);
  writeFileSync(join(directory, 'src', 'index.ts'), `${root.join('\n')}\n`);
  return {
    kind: 'synthetic',
    directory,
    leafFiles: settings.files,
    sourceFiles,
    fanout: settings.fanout,
    depth: settings.depth,
  };
}

function hash(bytes) {
  return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

function invoke(runtime, args, cwd, env) {
  const start = process.hrtime.bigint();
  const child = spawnSync(runtime, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  const stdout = child.stdout ?? Buffer.alloc(0);
  const stderr = child.stderr ?? Buffer.alloc(0);
  return {
    stdout,
    stderr,
    record: {
      elapsedMs,
      exitCode: child.status,
      signal: child.signal,
      error: child.error?.message,
      stdout: hash(stdout),
      stderr: hash(stderr),
    },
  };
}

function statistics(times) {
  const sorted = times.toSorted((a, b) => a - b);
  let total = 0;
  for (const time of times) total += time;
  const middle = Math.floor(times.length / 2);
  const mean = total / times.length;
  let squared = 0;
  for (const time of times) squared += (time - mean) ** 2;
  const standardDeviation = Math.sqrt(squared / times.length);
  return {
    runs: times.length,
    meanMs: mean,
    medianMs: times.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    minMs: sorted[0],
    maxMs: sorted.at(-1),
    p90Ms: sorted[Math.ceil(times.length * 0.9) - 1],
    standardDeviationMs: standardDeviation,
    coefficientOfVariation: mean === 0 ? 0 : standardDeviation / mean,
  };
}

function benchmark(settings) {
  const output = openSync(settings.output, 'wx');
  let temporary;
  let edit;
  let benchmarkError;
  const report = {
    version: 1,
    startedAt: new Date().toISOString(),
    parity: false,
    runtime: settings.runtime,
    cacheMode: settings.cacheMode,
    cacheScope: 'Knip and Jiti; Node compile cache disabled; OS/runtime caches not flushed',
    measuredPairs: settings.runs,
    warmupPairs: 1,
    passthrough: settings.passthrough,
    host: {
      platform: platform(),
      release: release(),
      arch: arch(),
      cpu: cpus()[0]?.model,
      loadAverageBefore: loadavg(),
    },
    pairs: [],
  };
  try {
    temporary = mkdtempSync(join(tmpdir(), 'knip-benchmark-native-'));
    report.workload = settings.generate
      ? generate(join(temporary, 'workload'), settings)
      : { kind: 'directory', directory: settings.directory };
    const directory = report.workload.directory;
    if (!statSync(join(directory, 'package.json'), { throwIfNoEntry: false })?.isFile())
      throw new Error('Workload requires package.json');
    if (settings.cacheMode === 'edit') {
      const path = resolve(directory, settings.editFile ?? 'src/group-0/leaf-0.ts');
      if (!path.startsWith(`${directory}/`) || !/\.[cm]?[jt]sx?$/.test(path))
        throw new Error('--edit-file must be a JavaScript or TypeScript source inside the workload');
      const stats = lstatSync(path, { throwIfNoEntry: false });
      if (!stats?.isFile()) throw new Error('--edit-file must be a regular file');
      const original = readFileSync(path);
      edit = { path, stats, original, expected: original };
      report.edit = { path, original: hash(original), change: 'Append one additional newline per measured pair' };
    }
    const runtime = (settings.runtime === 'bun') === !!process.versions.bun ? process.execPath : settings.runtime;
    const version = spawnSync(runtime, ['--version'], { encoding: 'utf8' });
    if (version.error || version.signal || version.status !== 0)
      throw new Error(`Cannot run ${runtime}: ${version.error?.message ?? version.stderr}`);
    report.runtimeVersion = version.stdout.trim();
    report.runtimeExecutable = runtime;
    report.cli = {};
    report.cacheLocations = {};
    const commands = {};
    const environments = {};
    const environment = { ...process.env, FORCE_COLOR: undefined };
    const reporter = settings.passthrough.some(arg => arg === '--reporter' || arg.startsWith('--reporter='))
      ? []
      : ['--reporter', 'json'];
    for (const engine of engines) {
      const cache = join(temporary, engine);
      report.cacheLocations[engine] = cache;
      const args = [settings.cli[engine], '--no-progress', ...reporter, '--cache-location', cache];
      if (settings.cacheMode !== 'none') args.push('--cache');
      args.push(...settings.passthrough);
      commands[engine] = args;
      environments[engine] = {
        ...environment,
        NO_COLOR: '1',
        NODE_DISABLE_COMPILE_CACHE: '1',
        JITI_FS_CACHE: settings.cacheMode === 'none' ? 'false' : join(cache, 'jiti'),
      };
      report.cli[engine] = { path: settings.cli[engine], ...hash(readFileSync(settings.cli[engine])), args };
    }
    const times = { baseline: [], candidate: [] };
    for (let index = 0; index <= settings.runs; index++) {
      const order = index % 2 === 0 ? ['baseline', 'candidate'] : ['candidate', 'baseline'];
      const pair = { index, warmup: index === 0, order, parity: false };
      const results = {};
      report.pairs.push(pair);
      if (edit && index > 0) {
        if (!readFileSync(edit.path).equals(edit.expected))
          throw new Error('Edited source changed outside the benchmark');
        edit.expected = Buffer.concat([edit.original, Buffer.alloc(index, 10)]);
        writeFileSync(edit.path, edit.expected);
      }
      if (edit) pair.edit = hash(edit.expected);
      for (const engine of order) {
        if (edit && !readFileSync(edit.path).equals(edit.expected))
          throw new Error('Edited source changed outside the benchmark');
        const cache = report.cacheLocations[engine];
        if (settings.cacheMode === 'cold') rmSync(cache, { recursive: true, force: true });
        if (settings.cacheMode !== 'none') mkdirSync(cache, { recursive: true });
        results[engine] = invoke(runtime, commands[engine], directory, environments[engine]);
        pair[engine] = results[engine].record;
      }
      let failure;
      for (const engine of engines) {
        const result = pair[engine];
        if (result.error || result.signal || (result.exitCode !== 0 && result.exitCode !== 1)) {
          failure = `${engine} failed: ${result.error ?? result.signal ?? `exit ${result.exitCode}`}`;
          break;
        }
      }
      if (!failure && pair.baseline.exitCode !== pair.candidate.exitCode) failure = 'Exit codes differ';
      if (!failure && !results.baseline.stdout.equals(results.candidate.stdout)) failure = 'stdout bytes differ';
      if (!failure && !results.baseline.stderr.equals(results.candidate.stderr)) failure = 'stderr bytes differ';
      if (failure) {
        const outputs = {};
        for (const engine of engines) {
          outputs[engine] = {
            stdoutBase64: results[engine].stdout.toString('base64'),
            stderrBase64: results[engine].stderr.toString('base64'),
          };
        }
        report.failure = { pair: index, message: failure, outputs };
        throw new Error(`${failure} in ${pair.warmup ? 'warmup' : `measured pair ${index}`}; see ${settings.output}`);
      }
      pair.parity = true;
      if (!pair.warmup) for (const engine of engines) times[engine].push(pair[engine].elapsedMs);
    }
    report.statistics = {};
    for (const engine of engines) report.statistics[engine] = statistics(times[engine]);
    const paired = statistics(times.baseline.map((time, index) => time / times.candidate[index]));
    report.speedup = {
      mean: report.statistics.baseline.meanMs / report.statistics.candidate.meanMs,
      median: report.statistics.baseline.medianMs / report.statistics.candidate.medianMs,
      pairedMean: paired.meanMs,
      pairedMedian: paired.medianMs,
      pairedMin: paired.minMs,
      pairedMax: paired.maxMs,
    };
    report.parity = true;
  } catch (error) {
    report.failure ??= { message: error.message };
    benchmarkError = error;
  } finally {
    report.finishedAt = new Date().toISOString();
    report.host.loadAverageAfter = loadavg();
    try {
      if (edit) {
        if (!readFileSync(edit.path).equals(edit.expected)) {
          benchmarkError = new Error('Edited source changed outside the benchmark; leaving it untouched');
        } else {
          writeFileSync(edit.path, edit.original);
          utimesSync(edit.path, edit.stats.atime, edit.stats.mtime);
        }
      }
      if (temporary) rmSync(temporary, { recursive: true, force: true });
    } catch (error) {
      benchmarkError ??= error;
    } finally {
      if (benchmarkError) {
        report.parity = false;
        report.speedup = undefined;
        report.statistics = undefined;
        report.failure ??= { message: benchmarkError.message };
      }
      try {
        writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
      } finally {
        closeSync(output);
      }
    }
  }
  if (benchmarkError) throw benchmarkError;
  return report;
}

try {
  const settings = options();
  if (!settings) process.stdout.write(help);
  else {
    const report = benchmark(settings);
    console.log(
      `Exact CLI parity verified: 1 discarded warmup pair + ${settings.runs} measured pairs (${report.workload.kind}, ${settings.cacheMode} cache).`
    );
    for (const engine of engines) {
      const stats = report.statistics[engine];
      console.log(
        `${engine}: mean ${stats.meanMs.toFixed(2)} ms, median ${stats.medianMs.toFixed(2)} ms, min ${stats.minMs.toFixed(2)} ms, max ${stats.maxMs.toFixed(2)} ms`
      );
    }
    console.log(
      `Baseline/candidate speedup: mean ${report.speedup.mean.toFixed(3)}x, median ${report.speedup.median.toFixed(3)}x`
    );
    if (settings.generate) console.log('Synthetic graph stress workload; not real-repository throughput.');
    console.log(`JSON results: ${settings.output}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
