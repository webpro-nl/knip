import assert from 'node:assert/strict';
import test from 'node:test';
import { ProjectPrincipal } from '../src/ProjectPrincipal.ts';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/queue-dedup');

test('Queue dedup: walkAndAnalyze does not push duplicate entries', async () => {
  let capturedQueueLength = -1;
  const orig = ProjectPrincipal.prototype.walkAndAnalyze;
  ProjectPrincipal.prototype.walkAndAnalyze = function (...args) {
    orig.apply(this, args);
    capturedQueueLength = this.lastQueueLength;
  };

  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  ProjectPrincipal.prototype.walkAndAnalyze = orig;

  assert(!('leaf.ts' in issues.files));
  assert(!('shared-a.ts' in issues.files));
  assert(!('shared-b.ts' in issues.files));

  assert.equal(capturedQueueLength, 5, `Queue should have 5 unique entries, got ${capturedQueueLength}`);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});
