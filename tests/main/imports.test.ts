import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

test('Find unused files and exports', async () => {
  const cwd = resolve('tests/fixtures/imports');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['index.ts']['side-effects']);
  assert(issues.unlisted['index.ts']['aliased-binding']);
  assert(issues.unlisted['index.ts']['default-and-named-binding']);
  assert(issues.unlisted['index.ts']['default-identifier']);
  assert(issues.unlisted['index.ts']['named-object-binding']);

  assert(issues.unlisted['index.ts']['top-level-await-import']);
  assert(issues.unlisted['index.ts']['top-level-side-effects-call']);

  assert(issues.unlisted['index.ts']['side-effects-call']);
  assert(issues.unlisted['index.ts']['await-import-call']);
  assert(issues.unlisted['index.ts']['object-bindings']);

  assert(issues.unlisted['index.ts']['no-substitution-tpl-literal']);
  assert(issues.unlisted['index.ts']['string-literal']);

  assert(issues.unlisted['index.ts']['import-a']);
  assert(issues.unlisted['index.ts']['prop-access']);
  assert(issues.unlisted['index.ts']['prop-access-over-bindings']);
  assert(issues.unlisted['index.ts']['default-prop-access']);

  assert(issues.unlisted['index.ts']['promise-like']);
  assert(issues.unlisted['index.ts']['ignore-bindings']);
  assert(issues.unlisted['index.ts']['inside-expression']);

  assert(issues.unlisted['dir/mod.ts']['another-unlisted']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 20,
    processed: 3,
    total: 3,
  });
});
