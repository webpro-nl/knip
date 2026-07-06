import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/child-process-exec');

test('Reference binaries and entry files in node:child_process calls', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  const binaries = issues.binaries['index.ts'];

  // exec/execSync: the argument is a shell command string (operators are real commands)
  assert(binaries.mango);
  assert(binaries.papaya);
  assert(binaries.kumquat);
  assert(binaries.mandarin);

  // spawn/execFile/spawnSync/execFileSync: executable + literal args array
  assert(binaries.lychee);
  assert(binaries.guava);
  assert(binaries.durian);
  assert(binaries.rambutan);

  // namespace, default and aliased imports
  assert(binaries.passionfruit);
  assert(binaries.dragonfruit);
  assert(binaries.jackfruit);
  assert(binaries.starfruit);

  // options objects and callbacks are ignored; the executable is still referenced
  assert(binaries.lemon);
  assert(binaries.lime);
  assert(binaries.coconut);
  assert(binaries.peach);
  assert(binaries.plum);
  assert(binaries.apricot);

  // executable referenced, but a shell metacharacter in a literal arg yields no phantom binary
  assert(binaries.cherry);
  assert(binaries.grape);
  assert(!binaries.phantomdeploy);
  assert(!binaries.phantomgrep);

  assert(binaries.fig);
  assert(binaries.melon);
  assert(!binaries.phantomserve);

  // dynamic command and a non-child_process `.exec` are not referenced
  assert(!binaries.kiwi);
  assert(!binaries.banana);

  assert.equal(Object.keys(binaries).length, 22);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 22,
    processed: 3,
    total: 3,
  });
});
