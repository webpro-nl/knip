import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/types/declare-module-augmentation');

test('Type used only in a declare module augmentation is not reported unused', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.types['events.ts']?.['BaseEntity']);
  assert(!issues.types['events.ts']?.['EventEnvelope']);
  assert(!issues.types['events.ts']?.['AuditTrail']);
  assert(!issues.types['events.ts']?.['ArchiveMeta']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});
