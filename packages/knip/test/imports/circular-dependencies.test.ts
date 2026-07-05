import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/circular-dependencies');

test('Does not report circular dependencies by default', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.cycles).length, 0);
  assert.deepEqual(counters, { ...baseCounters, processed: 11, total: 11 });
});

test('Reports circular dependencies when included', async () => {
  const options = await createOptions({ cwd, includedIssueTypes: ['cycles'] });
  const { issues, counters } = await main(options);

  const chain = 'ping.ts → pong.ts';
  const issue = issues.cycles['ping.ts'][chain];
  assert.equal(issue.symbol, chain);
  assert.deepEqual(
    issue.symbols?.map(s => s.symbol),
    ['ping.ts', 'pong.ts']
  );
  assert.deepEqual(
    issue.symbols?.map(({ kind, specifier, line, col }) => ({ kind, specifier, line, col })),
    [
      { kind: 'import', specifier: './pong', line: 1, col: 10 },
      { kind: 'import', specifier: './ping', line: 1, col: 10 },
    ]
  );
  assert.equal(issue.severity, 'warn');

  const fruitChain = 'apricot.ts → banana.ts';
  const fruitIssue = issues.cycles['apricot.ts'][fruitChain];
  assert.equal(fruitIssue.symbol, fruitChain);
  assert.deepEqual(
    fruitIssue.symbols?.map(s => s.symbol),
    ['apricot.ts', 'banana.ts']
  );

  assert.deepEqual(Object.keys(issues.cycles['citrus.ts']).sort(), [
    'citrus.ts → lemon.ts → lime.ts',
    'citrus.ts → lemon.ts → orange.ts',
  ]);

  const dynamicIssue = Object.values(issues.cycles)
    .flatMap(issuesByFile => Object.values(issuesByFile))
    .find(issue => issue.symbol.includes('zucchini.ts') && issue.symbol.includes('zoodle.ts'));
  assert.equal(dynamicIssue, undefined);

  assert.deepEqual(counters, { ...baseCounters, cycles: 4, processed: 11, total: 11 });
});

test('Allows circular dependencies by exact cycle path', async () => {
  const options = await createOptions({ cwd, args: { cycles: true, config: 'allow-cycle-path.json' } });
  const { issues, counters } = await main(options);

  assert.equal(issues.cycles['apricot.ts'], undefined);
  assert.equal(issues.cycles['ping.ts']['ping.ts → pong.ts'].symbol, 'ping.ts → pong.ts');
  assert.deepEqual(counters, { ...baseCounters, cycles: 3, processed: 11, total: 11 });
});

test('Includes dynamic import() cycles when cycles.dynamicImports is enabled', async () => {
  const options = await createOptions({ cwd, args: { cycles: true, config: 'dynamic-imports.json' } });
  const { issues, counters } = await main(options);

  const dynamicIssue = Object.values(issues.cycles)
    .flatMap(issuesByFile => Object.values(issuesByFile))
    .find(issue => issue.symbol.includes('zucchini.ts') && issue.symbol.includes('zoodle.ts'));

  assert.ok(dynamicIssue);
  assert.ok(dynamicIssue.symbols?.some(s => s.kind === 'dynamicImport'));
  assert.deepEqual(counters, { ...baseCounters, cycles: 5, processed: 11, total: 11 });
});

test('Reports only circular dependencies with --cycles shorthand', async () => {
  const options = await createOptions({ cwd, args: { cycles: true } });
  const enabledIssueTypes = Object.entries(options.includedIssueTypes)
    .filter(([, isIncluded]) => isIncluded)
    .map(([issueType]) => issueType);

  assert.deepEqual(enabledIssueTypes, ['cycles']);
  assert.equal(options.isReportCycles, true);
  assert.equal(options.isReportFiles, false);
  assert.equal(options.isReportDependencies, false);
  assert.equal(options.isReportExports, false);
});
