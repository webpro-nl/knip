import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import test from 'node:test';
import { perfObserver as observer } from '../../src/util/Performance.ts';

const perfObserver: typeof observer = Reflect.construct(observer.constructor, [
  { isTimerifyFunctions: true, isMemoryUsageEnabled: true },
]);

test('Make Knip memory samples available immediately and ignore unrelated marks', () => {
  perfObserver.reset();
  performance.mark('unrelated', { detail: { label: 'foreign', heapUsed: 1, heapTotal: 1, rss: 1 } });
  perfObserver.addMemoryMark('checkpoint');
  const table = perfObserver.getMemoryUsageTable();
  assert.match(table, /checkpoint/);
  assert.doesNotMatch(table, /foreign/);
  performance.clearMarks('unrelated');
});

test('Keep existing timer wrappers usable after resetting measurements', () => {
  const measured = performance.timerify(() => 42, { histogram: perfObserver.registerHistogram('reset-probe') });
  assert.equal(measured(), 42);
  assert.match(perfObserver.getTimerifiedFunctionsTable(), /reset-probe/);
  perfObserver.reset();
  assert.equal(perfObserver.getTimerifiedFunctionsTable(), '');
  assert.equal(measured(), 42);
  assert.match(perfObserver.getTimerifiedFunctionsTable(), /reset-probe/);
});

test('Restart the run clock when resetting measurements', () => {
  const before = performance.now();
  perfObserver.reset();
  const after = performance.now();
  const { processMs, durationMs } = perfObserver.getSnapshot();
  const start = processMs - durationMs;
  assert.ok(start >= before);
  assert.ok(start <= after);
});

test('Separate process time from run time and stop timing before statistics are printed', async () => {
  perfObserver.startRun();
  perfObserver.finalize();
  const duration = perfObserver.getCurrentDurationInMs();
  const processTime = perfObserver.getProcessDurationInMs();
  assert.ok(processTime > duration);
  await Promise.resolve();
  assert.equal(perfObserver.getCurrentDurationInMs(), duration);
  assert.equal(perfObserver.getProcessDurationInMs(), processTime);
  perfObserver.reset();
  assert.ok(perfObserver.getProcessDurationInMs() > processTime);
});

test('Expose precise statistics without tying snapshots to mutable measurements', () => {
  perfObserver.reset();
  const histogram = perfObserver.registerHistogram('sub-microsecond');
  histogram.record(800);
  perfObserver.addMemoryMark('snapshot');
  const snapshot = perfObserver.getSnapshot();
  const entry = snapshot.functions.find(entry => entry.name === 'sub-microsecond');
  assert(entry);
  assert.equal(entry.count, 1);
  assert.equal(entry.meanMs, 0.0008);
  assert.equal(entry.p95Ms, 0.0008);
  assert.match(perfObserver.getTimerifiedFunctionsTable(), /0\.80µs/);
  snapshot.memory[0].label = 'changed';
  assert.doesNotMatch(perfObserver.getMemoryUsageTable(), /changed/);
  perfObserver.reset();
  assert.equal(perfObserver.getSnapshot().functions.length, 0);
  assert.equal(entry.count, 1);
  assert.doesNotThrow(() => JSON.stringify(snapshot));
});
