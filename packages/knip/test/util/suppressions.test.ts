import assert from 'node:assert/strict';
import test from 'node:test';
import { ISSUE_TYPES } from '../../src/constants.js';
import type { Issues } from '../../src/types/issues.js';
import type { Suppressions } from '../../src/types/suppressions.js';
import { applySuppressions, mergeSuppressions, pruneSuppressions, stringify } from '../../src/util/suppressions.js';

const createEmptyIssues = (): Issues => {
  const issues: any = { files: new Set(), _files: {} };
  for (const type of ISSUE_TYPES) {
    if (type !== 'files') issues[type] = {};
  }
  return issues as Issues;
};

test('applySuppressions: suppresses matching issues', () => {
  const issues = createEmptyIssues();
  issues.exports['file.ts'] = { foo: { symbol: 'foo' } } as any;

  const suppressions: Suppressions = {
    version: 1,
    suppressions: {
      'file.ts': {
        exports: { foo: {} },
      },
    },
  };

  const result = applySuppressions(issues, suppressions);

  assert.equal(result.suppressedCount, 1);
  assert.equal(issues.exports['file.ts'], undefined);
});

test('applySuppressions: ignores unmatched suppressions', () => {
  const issues = createEmptyIssues();

  const suppressions: Suppressions = {
    version: 1,
    suppressions: {
      'file.ts': {
        exports: { foo: {} },
      },
    },
  };

  const result = applySuppressions(issues, suppressions);

  assert.equal(result.suppressedCount, 0);
});

test('applySuppressions: counts expired suppressions', () => {
  const issues = createEmptyIssues();
  const suppressions: Suppressions = {
    version: 1,
    suppressions: {
      'expired.ts': {
        files: { 'expired.ts': { until: '2000-01-01' } },
      },
    },
  };

  const result = applySuppressions(issues, suppressions);

  assert.equal(result.expiredCount, 1);
  assert.equal(result.suppressedCount, 0);
});

test('pruneSuppressions: preserves custom fields', () => {
  const issues = createEmptyIssues();
  issues.exports['file.ts'] = { foo: { symbol: 'foo' } } as any;

  const suppressions: Suppressions = {
    version: 1,
    suppressions: {
      'file.ts': {
        exports: {
          foo: { ticket: 'JIRA-123' },
          bar: {},
        } as any,
      },
    },
  };

  const result = pruneSuppressions(issues, suppressions);
  const entry = result.suppressions['file.ts'].exports as any;

  assert.equal(entry.foo.ticket, 'JIRA-123');
  assert.equal(entry.bar, undefined);
});

test('mergeSuppressions: preserves custom fields from existing', () => {
  const existing = {
    version: 1,
    suppressions: {
      'file.ts': {
        exports: {
          foo: { ticket: 'JIRA-789' },
        } as any,
      },
    },
  };

  const incoming = {
    version: 1,
    suppressions: {
      'file.ts': {
        exports: { bar: {} },
      },
    },
  };

  const result = mergeSuppressions(existing, incoming);
  const entry = result.suppressions['file.ts'].exports as any;

  assert.equal(entry.foo.ticket, 'JIRA-789');
  assert.deepEqual(entry.bar, {});
});

test('pruneSuppressions: preserves custom fields on files entries', () => {
  const issues = createEmptyIssues();
  issues._files['old.ts'] = {
    'old.ts': { type: 'files', filePath: '/old.ts', symbol: 'old.ts', severity: 'error', fixes: [] },
  } as any;

  const suppressions = {
    version: 1,
    suppressions: {
      'old.ts': {
        files: {
          'old.ts': { until: '3000-01-01', ticket: 'JIRA-123' },
        } as any,
      },
    },
  };

  const result = pruneSuppressions(issues, suppressions);
  const entry = result.suppressions['old.ts'].files as any;

  assert.equal(entry['old.ts'].until, '3000-01-01');
  assert.equal(entry['old.ts'].ticket, 'JIRA-123');
});

test('stringify: sorts keys at all levels', () => {
  const output = stringify({
    version: 1,
    suppressions: {
      'z-file.ts': {
        exports: { beta: {}, alpha: {} },
        dependencies: { zlib: {} },
      },
      'a-file.ts': {
        files: { 'a-file.ts': {} },
      },
    },
  });

  const lines = output.split('\n');
  assert.equal(lines[0], '{');
  assert.equal(lines[1], '  "version": 1,');
  assert.equal(lines[2], '  "suppressions": {');
  assert.equal(lines[3], '    "a-file.ts": {');
  assert.equal(lines[8], '    "z-file.ts": {');
  assert.equal(lines[9], '      "dependencies": {');
  assert.equal(lines[12], '      "exports": {');
  assert.equal(lines[13], '        "alpha": {},');
  assert.equal(lines[14], '        "beta": {}');
});

test('stringify: produces valid JSON that round-trips', () => {
  const input: Suppressions = {
    version: 1,
    suppressions: {
      'file.ts': {
        exports: { foo: { until: '2026-12-31' }, bar: {} },
      },
    },
  };

  const output = stringify(input);
  const parsed = JSON.parse(output);

  assert.equal(parsed.version, 1);
  assert.deepEqual(parsed.suppressions['file.ts'].exports.foo, { until: '2026-12-31' });
  assert.deepEqual(parsed.suppressions['file.ts'].exports.bar, {});
});

test('stringify: one line per symbol', () => {
  const output = stringify({
    version: 1,
    suppressions: {
      'file.ts': {
        exports: {
          plain: {},
          withMeta: { until: '2026-12-31' },
        },
      },
    },
  });

  const lines = output.split('\n');
  const plainLine = lines.find(l => l.includes('"plain"'));
  const metaLine = lines.find(l => l.includes('"withMeta"'));
  assert.equal(plainLine, '        "plain": {},');
  assert.equal(metaLine, '        "withMeta": {"until":"2026-12-31"}');
});

test('stringify: ends with trailing newline', () => {
  const output = stringify({ version: 1, suppressions: {} });
  assert.ok(output.endsWith('\n'));
  assert.ok(!output.endsWith('\n\n'));
});
