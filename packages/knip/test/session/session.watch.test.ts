import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import fs, { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { ConsoleStreamer } from '../../src/ConsoleStreamer.ts';
import { watchSession } from '../../src/session/watch.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

const waitFor = async (predicate: () => boolean) => {
  const deadline = Date.now() + 5000;
  while (!predicate() && Date.now() < deadline) await setTimeout(10);
  assert.ok(predicate(), 'Expected watch update before timeout');
};

const setup = async (t: TestContext) => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-session-watch-')));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, 'package.json'), '{"name":"session-watch","dependencies":{"left-pad":"1.0.0"}}');
  await writeFile(join(cwd, 'knip.json'), '{"entry":["index.ts"],"project":["*.ts"]}');
  await writeFile(
    join(cwd, 'index.ts'),
    "import { value } from './value.ts'; import 'left-pad'; console.log(value);\n"
  );
  await writeFile(join(cwd, 'value.ts'), 'export const value = 1;\nexport const unused = 2;\n');
  await writeFile(join(cwd, 'unused.ts'), 'export {};\n');
  const reports: string[] = [];
  const errors: string[] = [];
  const exitCode = process.exitCode;
  t.after(() => {
    process.exitCode = exitCode ?? 0;
  });
  t.mock.method(ConsoleStreamer.prototype, 'cast', (message: string | string[]) => {
    if (Array.isArray(message)) reports.push(message.join('\n'));
  });
  t.mock.method(console, 'error', (...args: unknown[]) => errors.push(args.join(' ')));
  return { cwd, reports, errors };
};

test('watch uses the options directory and refreshes structural changes and JSON reporter settings', async t => {
  const { cwd, reports, errors } = await setup(t);
  let loads = 0;
  const loadOptions = () => {
    loads++;
    return createOptions({ cwd, args: { watch: true } });
  };
  const watcher = await watchSession(await loadOptions(), loadOptions);
  try {
    assert.notEqual(cwd, process.cwd());
    assert.match(reports[0], /unused\.ts/);
    assert.match(reports[0], /unused/);
    assert.match(reports[0], /2 files \(/);
    await setTimeout(100);
    assert.equal(reports.length, 1);
    assert.equal(loads, 1);

    writeFileSync(join(cwd, 'value.ts'), 'export const value = 123;\nexport const unused = 2;\n');
    await waitFor(() => reports.length > 1);
    assert.equal(loads, 1);

    writeFileSync(join(cwd, 'index.ts'), "import { value } from './value.ts'; console.log(value);\n");
    await waitFor(() => reports.at(-1)?.includes('left-pad') === true);
    assert.ok(loads > 1);

    writeFileSync(join(cwd, 'knip.json'), '{"entry":["index.ts"],"project":["*.ts"],"include":["files"]}');
    await waitFor(() => reports.at(-1)?.includes('unused.ts') === true && !reports.at(-1)?.includes('left-pad'));
    assert.doesNotMatch(reports.at(-1) ?? '', /Unused exports|Unused files/);
    assert.match(reports.at(-1) ?? '', /2 files \(/);

    writeFileSync(join(cwd, 'added.ts'), 'export {};\n');
    await waitFor(() => reports.at(-1)?.includes('added.ts') === true);
    await rm(join(cwd, 'added.ts'));
    await waitFor(() => reports.at(-1)?.includes('added.ts') === false);
    assert.deepEqual(errors, []);
  } finally {
    await watcher.close();
  }
  const count = reports.length;
  writeFileSync(join(cwd, 'after-close.ts'), 'export {};\n');
  await setTimeout(100);
  assert.equal(reports.length, count);
});

test('watch treats atomic replacements as modifications and keeps watching later edits', async t => {
  const { cwd, reports, errors } = await setup(t);
  const staging = await realpath(await mkdtemp(join(tmpdir(), 'knip-watch-save-')));
  t.after(() => rm(staging, { recursive: true, force: true }));
  let loads = 0;
  const loadOptions = () => {
    loads++;
    return createOptions({ cwd, args: { watch: true } });
  };
  const watcher = await watchSession(await loadOptions(), loadOptions);
  try {
    writeFileSync(join(staging, 'value.ts'), 'export const value = 123;\nexport const unused = 2;\n');
    renameSync(join(staging, 'value.ts'), join(cwd, 'value.ts'));
    await waitFor(() => reports.length > 1);
    await setTimeout(100);
    assert.equal(loads, 1);
    assert.equal(reports.length, 2);

    writeFileSync(join(cwd, 'value.ts'), 'export const value = 456;\nexport const unused = 2;\n');
    await waitFor(() => reports.length > 2);
    await setTimeout(100);
    assert.equal(loads, 1);
    assert.equal(reports.length, 3);
    assert.deepEqual(errors, []);
  } finally {
    await watcher.close();
  }
});

test('watch refreshes files when their containing directory is moved in and removed', async t => {
  const { cwd, reports, errors } = await setup(t);
  await writeFile(join(cwd, 'knip.json'), '{"entry":["index.ts"],"project":["**/*.ts"]}');
  const staging = await realpath(await mkdtemp(join(tmpdir(), 'knip-watch-directory-')));
  t.after(() => rm(staging, { recursive: true, force: true }));
  await writeFile(join(staging, 'extra.ts'), 'export {};\n');
  const loadOptions = () => createOptions({ cwd, args: { watch: true } });
  const watcher = await watchSession(await loadOptions(), loadOptions);
  try {
    renameSync(staging, join(cwd, 'nested'));
    await waitFor(() => reports.at(-1)?.includes('nested/extra.ts') === true);
    await rm(join(cwd, 'nested'), { recursive: true });
    await waitFor(() => reports.at(-1)?.includes('nested/extra.ts') === false);
    assert.deepEqual(errors, []);
  } finally {
    await watcher.close();
  }
});

test('watch serializes compiler updates, reports failures once and recovers on the next edit', async t => {
  const { cwd, reports, errors } = await setup(t);
  await writeFile(join(cwd, 'knip.json'), '{"entry":["selection.foo"],"project":["*.ts","*.foo"]}');
  await writeFile(join(cwd, 'selection.foo'), 'apple');
  await writeFile(join(cwd, 'fruits.ts'), 'export const apple = 1;\nexport const banana = 2;\n');
  const compiled: string[] = [];
  let release = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const unhandled: unknown[] = [];
  const onUnhandledRejection = (error: unknown) => unhandled.push(error);
  process.on('unhandledRejection', onUnhandledRejection);
  t.after(() => process.off('unhandledRejection', onUnhandledRejection));
  const loadOptions = async () => {
    const options = await createOptions({ cwd, args: { watch: true, include: ['exports'] } });
    options.parsedConfig.compilers = {
      foo: async text => {
        compiled.push(text);
        if (text === 'invalid') throw new Error('Invalid fruit');
        if (text === 'banana') await gate;
        return `import { ${text} } from './fruits.ts'; console.log(${text});`;
      },
    };
    return options;
  };
  const watcher = await watchSession(await loadOptions(), loadOptions);
  try {
    assert.match(reports[0], /banana/);
    assert.doesNotMatch(reports[0], /apple/);

    writeFileSync(join(cwd, 'selection.foo'), 'banana');
    await waitFor(() => compiled.includes('banana'));
    writeFileSync(join(cwd, 'selection.foo'), 'apple');
    await setTimeout(50);
    assert.deepEqual(compiled, ['apple', 'banana']);
    release();
    await waitFor(() => reports.length >= 3 && reports.at(-1)?.includes('banana') === true);
    assert.match(reports[1], /apple/);
    assert.doesNotMatch(reports[1], /banana/);
    assert.doesNotMatch(reports.at(-1) ?? '', /apple/);

    writeFileSync(join(cwd, 'selection.foo'), 'invalid');
    await waitFor(() => errors.length > 0);
    await setTimeout(100);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /Compiler for \.foo failed.*selection\.foo/);
    assert.match(errors[0], /Reason: Invalid fruit/);
    assert.equal(process.exitCode, 2);

    writeFileSync(join(cwd, 'selection.foo'), 'banana');
    await waitFor(() => reports.at(-1)?.includes('apple') === true);
    assert.doesNotMatch(reports.at(-1) ?? '', /banana/);
    assert.equal(errors.length, 1);
    assert.deepEqual(unhandled, []);
  } finally {
    release();
    await watcher.close();
  }
});

test('watch deduplicates explicit compiler failure notifications and recovers after a changed file', async t => {
  if (process.env.KNIP_TEST_WATCH_DEDUPLICATION !== '1') {
    const result = spawnSync(
      process.execPath,
      [process.versions.bun ? 'test' : '--test', '--test-name-pattern', t.name, import.meta.filename],
      {
        env: { ...process.env, NODE_TEST_CONTEXT: undefined, KNIP_TEST_WATCH_DEDUPLICATION: '1' },
        encoding: 'utf8',
        timeout: 15000,
      }
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return;
  }
  const { cwd, reports, errors } = await setup(t);
  await writeFile(
    join(cwd, 'knip.json'),
    '{"entry":["selection.foo"],"project":["*.ts","*.foo"],"ignore":["node_modules/.watch-barrier"]}'
  );
  await writeFile(join(cwd, 'selection.foo'), 'apple');
  await writeFile(join(cwd, 'fruits.ts'), 'export const apple = 1;\nexport const banana = 2;\n');
  const compiled: string[] = [];
  const loadOptions = async () => {
    const options = await createOptions({ cwd, args: { watch: true, include: ['exports'] } });
    options.parsedConfig.compilers = {
      foo: text => {
        compiled.push(text);
        if (text === 'invalid') throw new Error('Invalid fruit');
        return `import { ${text} } from './fruits.ts'; console.log(${text});`;
      },
    };
    return options;
  };
  const events = new EventEmitter();
  let notify: fs.WatchListener<string> | undefined;
  const watchMock = t.mock.method(
    fs,
    'watch',
    (_path: fs.PathLike, _options: fs.WatchOptions, listener: fs.WatchListener<string>) => {
      notify = listener;
      return Object.assign(events, {
        close: () => {
          events.removeAllListeners();
        },
      });
    }
  );
  const barrierPath = join(cwd, 'node_modules/.watch-barrier');
  const statSync = fs.statSync;
  let errorsBeforeBarrier: number | undefined;
  const statMock = t.mock.method(fs, 'statSync', (...args: Parameters<typeof fs.statSync>) => {
    const stats = statSync(...args);
    if (args[0] === barrierPath) errorsBeforeBarrier = errors.length;
    return stats;
  });
  let syncFsExports = syncBuiltinESMExports;
  if (process.versions.bun) {
    const { mock } = await import('bun:test');
    syncFsExports = () => mock.module('node:fs', () => ({ ...fs, default: fs }));
  }
  t.after(() => {
    statMock.mock.restore();
    watchMock.mock.restore();
    syncFsExports();
  });
  syncFsExports();
  const unhandled: unknown[] = [];
  const onUnhandledRejection = (error: unknown) => unhandled.push(error);
  process.on('unhandledRejection', onUnhandledRejection);
  t.after(() => process.off('unhandledRejection', onUnhandledRejection));
  const watcher = await watchSession(await loadOptions(), loadOptions);
  try {
    assert.ok(notify, 'Expected watchSession to register the fs.watch callback');
    assert.equal(reports.length, 1);
    assert.match(reports[0], /banana/);
    assert.doesNotMatch(reports[0], /apple/);
    assert.deepEqual(compiled, ['apple']);

    writeFileSync(join(cwd, 'selection.foo'), 'invalid');
    notify('change', 'selection.foo');
    notify('change', 'selection.foo');
    notify('change', 'node_modules/.watch-barrier');
    await waitFor(() => errorsBeforeBarrier !== undefined);

    assert.equal(errorsBeforeBarrier, 1);
    assert.equal(errors.length, 1);
    const failure = errors[0];
    assert.match(failure, /Compiler for \.foo failed.*selection\.foo/);
    assert.match(failure, /Reason: Invalid fruit/);
    assert.deepEqual(compiled, ['apple', 'invalid']);
    assert.equal(reports.length, 1);
    assert.equal(process.exitCode, 2);

    writeFileSync(join(cwd, 'selection.foo'), 'banana');
    notify('change', 'selection.foo');
    await waitFor(() => reports.length > 1);

    assert.equal(reports.length, 2);
    assert.match(reports[1], /apple/);
    assert.doesNotMatch(reports[1], /banana/);
    assert.deepEqual(compiled, ['apple', 'invalid', 'banana']);
    assert.deepEqual(errors, [failure]);
    assert.deepEqual(unhandled, []);
  } finally {
    await watcher.close();
  }
});

test('watch surfaces executable configuration changes and stops reporting stale results', async t => {
  const { cwd, reports, errors } = await setup(t);
  await rm(join(cwd, 'knip.json'));
  await writeFile(join(cwd, 'settings.ts'), "export const entry = ['index.ts'];\n");
  await writeFile(
    join(cwd, 'knip.ts'),
    "import { entry } from './settings.ts'; export default { entry, project: ['*.ts'] };\n"
  );
  const loadOptions = () => createOptions({ cwd, args: { watch: true } });
  const watcher = await watchSession(await loadOptions(), loadOptions);
  try {
    const count = reports.length;
    writeFileSync(join(cwd, 'settings.ts'), "export const entry = ['unused.ts'];\n");
    await waitFor(() => errors.length > 0);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /configuration module changed; restart the session in a new process/);
    assert.equal(process.exitCode, 2);
    writeFileSync(join(cwd, 'value.ts'), 'export const changed = 123;\n');
    await setTimeout(100);
    assert.equal(reports.length, count);
    assert.equal(errors.length, 1);
  } finally {
    await watcher.close();
  }
});

test('watch rebuilds arbitrary compiler inputs outside the project patterns', async t => {
  const { cwd, reports, errors } = await setup(t);
  await writeFile(join(cwd, 'knip.json'), '{"entry":["selection.foo"],"project":["*.ts","*.foo"]}');
  await writeFile(join(cwd, 'selection.foo'), 'fruit');
  await writeFile(join(cwd, 'selection.txt'), 'apple');
  await writeFile(join(cwd, 'fruits.ts'), 'export const apple = 1;\nexport const banana = 2;\n');
  const compiled: string[] = [];
  const loadOptions = async () => {
    const options = await createOptions({ cwd, args: { watch: true, include: ['exports'] } });
    options.parsedConfig.compilers = {
      foo: () => {
        const selected = readFileSync(join(cwd, 'selection.txt'), 'utf8');
        compiled.push(selected);
        return `import { ${selected} } from './fruits.ts'; console.log(${selected});`;
      },
    };
    return options;
  };
  const watcher = await watchSession(await loadOptions(), loadOptions);
  try {
    assert.match(reports[0], /banana/);
    assert.doesNotMatch(reports[0], /apple/);
    writeFileSync(join(cwd, 'selection.txt'), 'banana');
    await waitFor(() => reports.at(-1)?.includes('apple') === true);
    await setTimeout(100);
    assert.deepEqual(compiled, ['apple', 'banana']);
    assert.equal(reports.length, 2);
    assert.doesNotMatch(reports.at(-1) ?? '', /banana/);
    assert.deepEqual(errors, []);
  } finally {
    await watcher.close();
  }
});

test('closing watch drains the active compiler and discards queued updates and reports', async t => {
  const { cwd, reports, errors } = await setup(t);
  await writeFile(join(cwd, 'knip.json'), '{"entry":["selection.foo"],"project":["*.ts","*.foo"]}');
  await writeFile(join(cwd, 'selection.foo'), 'initial');
  const compiled: string[] = [];
  let release = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const loadOptions = async () => {
    const options = await createOptions({ cwd, args: { watch: true } });
    options.parsedConfig.compilers = {
      foo: async text => {
        compiled.push(text);
        if (text === 'blocked') await gate;
        return "import './value.ts';";
      },
    };
    return options;
  };
  const watcher = await watchSession(await loadOptions(), loadOptions);
  try {
    writeFileSync(join(cwd, 'selection.foo'), 'blocked');
    await waitFor(() => compiled.includes('blocked'));
    writeFileSync(join(cwd, 'selection.foo'), 'queued');
    await setTimeout(50);
    const count = reports.length;
    let closed = false;
    const closing = watcher.close().then(() => {
      closed = true;
    });
    await setTimeout(10);
    assert.equal(closed, false);
    release();
    await closing;
    assert.deepEqual(compiled, ['initial', 'blocked']);
    assert.equal(reports.length, count);
    assert.deepEqual(errors, []);
  } finally {
    release();
    await watcher.close();
  }
});
