import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/barrel-namespace-chain');

test('Barrel namespace chain: no false positives from OPAQUE, broad namespace refs, or tag hints', async () => {
  const options = await createOptions({ cwd, tags: ['-knipignore'] });
  const { issues, counters, tagHints } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 8,
    total: 8,
  });

  assert.equal(issues.exports['protocol.ts']['lib.unusedExport'].symbol, 'unusedExport');
  assert.equal(issues.exports['protocol.ts']['lib.usedExport'], undefined);
  assert.equal(issues.exports['protocol.ts']['lib.taggedExport'], undefined);

  assert.equal(tagHints.size, 0);
});
