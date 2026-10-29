import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { main } from '../../src/index.ts';
import { type Input, toEntry, toProductionEntry } from '../../src/util/input.ts';
import { join } from '../../src/util/path.ts';
import { WorkspaceWorker } from '../../src/WorkspaceWorker.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/plugin-entry-dir');
const app = join(cwd, 'packages/app');

// Plugin inputs are injected into one workspace's worker, so the spelling, base and group of a pattern are exact
const run = async (t: TestContext, inputs: Input[], { isProduction = false, workspace = '.' } = {}) => {
  const runPlugins = t.mock.method(WorkspaceWorker.prototype, 'runPlugins', async function (this: WorkspaceWorker) {
    return this.name === workspace ? inputs : [];
  });
  try {
    return await main(await createOptions({ cwd, isProduction }));
  } finally {
    runPlugins.mock.restore();
  }
};

const spellings = {
  'relative positive, relative negative': ['*.ts', '!skip.ts'],
  'relative positive, absolute negative': ['*.ts', `!${app}/skip.ts`],
  'absolute positive, relative negative': [`${app}/*.ts`, '!skip.ts'],
  'absolute positive, absolute negative': [`${app}/*.ts`, `!${app}/skip.ts`],
};

for (const [spelling, patterns] of Object.entries(spellings)) {
  test(`Resolve plugin entry patterns from dir (${spelling})`, async t => {
    const inputs = patterns.map(pattern => ({ ...toEntry(pattern), dir: app }));
    const { issues, counters } = await run(t, inputs);

    assert.deepEqual(Object.keys(issues.files).sort(), ['keep.ts', 'packages/app/skip.ts', 'skip.ts']);
    assert.deepEqual(counters, { ...baseCounters, files: 3, processed: 4, total: 4 });
  });

  test(`Resolve plugin production entry patterns from dir (${spelling})`, async t => {
    const inputs = patterns.map(pattern => toProductionEntry(pattern, { dir: app }));
    const { issues, counters } = await run(t, inputs, { isProduction: true });

    assert.deepEqual(Object.keys(issues.files).sort(), ['keep.ts', 'packages/app/skip.ts', 'skip.ts']);
    assert.deepEqual(counters, { ...baseCounters, files: 3, processed: 4, total: 4 });
  });
}

test('Apply a negation with the same dir in a plugin group', async t => {
  const inputs = [
    { ...toEntry('*.ts'), dir: app, group: 'mocha' },
    { ...toEntry('!skip.ts'), dir: app, group: 'mocha' },
  ];
  const { issues, counters } = await run(t, inputs);

  assert.deepEqual(Object.keys(issues.files).sort(), ['keep.ts', 'packages/app/skip.ts', 'skip.ts']);
  assert.deepEqual(counters, { ...baseCounters, files: 3, processed: 4, total: 4 });
});

// A negation applies to the patterns that share its base, so these negations do not reach `packages/app/skip.ts`
// (same plugin group and same target as the positive pattern; a plugin names one base per script)
const otherBaseNegations = {
  'absolute negative without dir': toEntry(`!${app}/skip.ts`),
  'absolute negative with the workspace dir': { ...toEntry(`!${app}/skip.ts`), dir: cwd },
  'relative negative without dir': toEntry('!packages/app/skip.ts'),
};

for (const [spelling, negation] of Object.entries(otherBaseNegations)) {
  test(`Keep a negation with another base out of the group of a pattern with dir (${spelling})`, async t => {
    const inputs = [
      { ...toEntry(`${app}/*.ts`), dir: app, group: 'mocha' },
      { ...negation, group: 'mocha' },
    ];
    const { issues, counters } = await run(t, inputs);

    assert.deepEqual(Object.keys(issues.files).sort(), ['keep.ts', 'skip.ts']);
    assert.deepEqual(counters, { ...baseCounters, files: 2, processed: 4, total: 4 });
  });
}

test('Keep a pattern with dir out of the workspace negations added for a `**/` sibling', async t => {
  const inputs = [{ ...toEntry('keep.ts'), dir: app }, toEntry('**/test/*.ts')];
  const { issues, counters } = await run(t, inputs);

  assert.deepEqual(Object.keys(issues.files).sort(), ['keep.ts', 'packages/app/skip.ts', 'skip.ts']);
  assert.deepEqual(counters, { ...baseCounters, files: 3, processed: 4, total: 4 });
});

test('Keep a pattern with dir out of the workspace negations added for a `**/` sibling in a plugin group', async t => {
  const inputs = [
    { ...toEntry('keep.ts'), dir: app, group: 'mocha' },
    { ...toEntry('**/test/*.ts'), group: 'mocha' },
    { ...toEntry('!nothing.ts'), group: 'mocha' },
  ];
  const { issues, counters } = await run(t, inputs);

  assert.deepEqual(Object.keys(issues.files).sort(), ['keep.ts', 'packages/app/skip.ts', 'skip.ts']);
  assert.deepEqual(counters, { ...baseCounters, files: 3, processed: 4, total: 4 });
});

test('Resolve plugin entry patterns from the dir of a sibling workspace', async t => {
  const inputs = [
    { ...toEntry('*.ts'), dir: app },
    { ...toEntry('!skip.ts'), dir: app },
  ];
  const { issues, counters } = await run(t, inputs, { workspace: 'packages/lib' });

  assert.deepEqual(Object.keys(issues.files).sort(), ['keep.ts', 'packages/app/skip.ts', 'skip.ts']);
  assert.deepEqual(counters, { ...baseCounters, files: 3, processed: 4, total: 4 });
});

// A pattern with the dir of an ignored workspace globs in a group of its own, from inside that directory, where the
// negated directory alone would not exclude it: its glob call negates the ignored workspace with its contents
const ignored = join(cwd, 'packages/ignored');
const ignoredSpellings = {
  'relative with dir': [{ ...toEntry('keep.ts'), dir: ignored }],
  'absolute with dir': [{ ...toEntry(`${ignored}/keep.ts`), dir: ignored }],
  'absolute with dir beside a `**/` sibling': [
    { ...toEntry(`${ignored}/keep.ts`), dir: ignored },
    toEntry('**/test/*.ts'),
  ],
};

for (const [spelling, inputs] of Object.entries(ignoredSpellings)) {
  test(`Keep a pattern with the dir of an ignored workspace out of it (${spelling})`, async t => {
    const { issues, counters } = await run(t, inputs);

    assert.deepEqual(Object.keys(issues.files).sort(), [
      'keep.ts',
      'packages/app/keep.ts',
      'packages/app/skip.ts',
      'skip.ts',
    ]);
    assert.deepEqual(counters, { ...baseCounters, files: 4, processed: 4, total: 4 });
  });
}

// TODO Without dir, the pattern globs in the default group with the negated directory only, which does not exclude a
// static pattern that starts inside that directory unless a `**/` sibling makes the crawl pass through it
test('Consume an absolute pattern into an ignored workspace without dir (pre-existing)', async t => {
  const { issues, counters } = await run(t, [toEntry(`${ignored}/keep.ts`)]);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'keep.ts',
    'packages/app/keep.ts',
    'packages/app/skip.ts',
    'skip.ts',
  ]);
  assert.deepEqual(counters, { ...baseCounters, files: 4, processed: 5, total: 5 });
});

// The ignored workspace of a non-root worker is negated relative to the worker's directory, as its other workspace
// negations are
const nestedIgnored = join(app, 'nested/ignored');
const nestedIgnoredSpellings = {
  'relative with dir': [{ ...toEntry('keep.ts'), dir: nestedIgnored }],
  'absolute with dir': [{ ...toEntry(`${nestedIgnored}/keep.ts`), dir: nestedIgnored }],
  'absolute with dir beside a `**/` sibling': [
    { ...toEntry(`${nestedIgnored}/keep.ts`), dir: nestedIgnored },
    toEntry('**/test/*.ts'),
  ],
};

for (const [spelling, inputs] of Object.entries(nestedIgnoredSpellings)) {
  test(`Keep a pattern with the dir of an ignored workspace nested in the worker's workspace out of it (${spelling})`, async t => {
    const { issues, counters } = await run(t, inputs, { workspace: 'packages/app' });

    assert.deepEqual(Object.keys(issues.files).sort(), [
      'keep.ts',
      'packages/app/keep.ts',
      'packages/app/skip.ts',
      'skip.ts',
    ]);
    assert.deepEqual(counters, { ...baseCounters, files: 4, processed: 4, total: 4 });
  });
}
