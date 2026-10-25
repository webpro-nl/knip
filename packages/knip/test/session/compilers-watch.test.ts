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
    await assert.rejects(session.handleFileChanges([{ type: 'modified', filePath: 'selection.foo' }]), error => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Compiler for \.foo failed.*selection\.foo/);
      assert.ok(error.cause instanceof Error);
      assert.match(error.cause.message, /Invalid fruit/);
      return true;
    });
    await setImmediate();
    assert.deepEqual(errors, []);
    assert.deepEqual(unhandled, []);

    await writeFile(filePath, 'banana\n');
    await session.handleFileChanges([{ type: 'modified', filePath: 'selection.foo' }]);

    assert.deepEqual(Object.keys(session.getIssues().issues.exports['fruits.ts']), ['apple']);
    assert.deepEqual(errors, []);
  } finally {
    process.off('unhandledRejection', onUnhandledRejection);
    await rm(cwd, { recursive: true, force: true });
  }
});
