import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import test from 'node:test';
import { run } from '../../src/run.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Report failed watch compilations once and recover on the next edit', async t => {
  const cwd = await copyFixture('fixtures/session-compilers');
  const filePath = join(cwd, 'selection.foo');
  const exitCode = process.exitCode;
  const errors: unknown[][] = [];
  const unhandled: unknown[] = [];
  const onUnhandledRejection = (error: unknown) => unhandled.push(error);
  t.mock.method(console, 'error', (...args: unknown[]) => errors.push(args));
  process.on('unhandledRejection', onUnhandledRejection);

  try {
    const options = await createOptions({ cwd, isSession: true });
    const { session } = await run(options);
    assert.ok(session);

    await writeFile(filePath, 'invalid\n');
    session.listener('change', 'selection.foo');
    await session.handleFileChanges([]);
    await setImmediate();

    const message = errors.flat().join('\n');
    assert.equal(errors.length, 1);
    assert.equal(message.match(/Compiler for \.foo/g)?.length, 1);
    assert.match(message, /Compiler for \.foo failed.*selection\.foo/);
    assert.match(message, /Reason: Invalid fruit/);
    assert.equal(process.exitCode, 2);
    assert.deepEqual(unhandled, []);

    await writeFile(filePath, 'banana\n');
    session.listener('change', 'selection.foo');
    await session.handleFileChanges([]);

    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['apple']);
    assert.equal(errors.flat().join('\n'), message);
  } finally {
    process.exitCode = exitCode ?? 0;
    process.off('unhandledRejection', onUnhandledRejection);
    await rm(cwd, { recursive: true, force: true });
  }
});
