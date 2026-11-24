import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createSession } from '../../src/session/session.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';
import { join } from '../../src/util/path.ts';

const cwd = resolve('fixtures/imports/import-meta-glob-subpath-imports');

test('Resolve import.meta.glob patterns through package.json imports', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('src/foo.ts' in issues.files));
  assert(!('lib/bar.ts' in issues.files));
  assert(!('mod/baz.ts' in issues.files));
  assert.equal(Object.keys(issues.subpaths).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});

test('Keep import.meta.glob subpath references after a watch rebuild', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  const filePath = join(cwd, 'src/foo.ts');
  const source = readFileSync(filePath, 'utf8');
  writeFileSync(filePath, `import '../lib/bar.ts';\n${source}`);

  try {
    await session.handleFileChanges([{ type: 'modified', filePath }]);

    const { issues } = session.getIssues();
    assert.equal(Object.keys(issues.subpaths).length, 0);
  } finally {
    writeFileSync(filePath, source);
  }
});
