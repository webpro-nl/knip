import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import type { Rules } from '../src/types/issues.js';
import type { Suppressions } from '../src/types/suppressions.js';
import { defaultRules } from '../src/util/issue-initializers.js';
import {
  applySuppressions,
  generateSuppressions,
  mergeSuppressions,
  pruneSuppressions,
} from '../src/util/suppressions.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/suppressions');

test('Baseline: fixture produces expected issues without suppressions', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files.size > 0);
  assert(issues.exports['module.ts']['unusedExport']);
  assert(issues.exports['module.ts']['anotherUnused']);
  assert(issues.dependencies['package.json']['used-pkg']);
  assert(issues.dependencies['package.json']['unused-pkg']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 2,
    exports: 2,
    processed: 3,
    total: 3,
  });
});

test('generateSuppressions creates correct structure', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const suppressions = generateSuppressions(issues);

  assert.equal(suppressions.version, 1);
  assert(suppressions.suppressions['unused.ts']);
  const fileSymbols = suppressions.suppressions['unused.ts'].files;
  assert(fileSymbols);
  assert(fileSymbols['unused.ts']);

  assert(suppressions.suppressions['module.ts']);
  const exportSymbols = suppressions.suppressions['module.ts'].exports;
  assert(exportSymbols);
  assert(exportSymbols['anotherUnused']);
  assert(exportSymbols['unusedExport']);

  assert(suppressions.suppressions['package.json']);
  const depSymbols = suppressions.suppressions['package.json'].dependencies;
  assert(depSymbols);
  assert(depSymbols['unused-pkg']);
  assert(depSymbols['used-pkg']);
});

test('generateSuppressions with --include only includes that type', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const rules: Rules = { ...defaultRules };
  for (const type of Object.keys(rules) as (keyof Rules)[]) {
    if (type !== 'exports') rules[type] = 'off';
  }
  const suppressions = generateSuppressions(issues, undefined, rules);

  assert.equal(suppressions.version, 1);
  assert(suppressions.suppressions['module.ts']);
  assert(!suppressions.suppressions['unused.ts']);
  assert(!suppressions.suppressions['package.json']);
});

test('--suppress-all with --include merges with existing', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const existing: Suppressions = {
    version: 1,
    suppressions: {
      'package.json': {
        dependencies: { 'unused-pkg': {} },
      },
    },
  };

  const rules: Rules = { ...defaultRules };
  for (const type of Object.keys(rules) as (keyof Rules)[]) {
    if (type !== 'exports') rules[type] = 'off';
  }
  const newSuppressions = generateSuppressions(issues, undefined, rules);
  const merged = mergeSuppressions(existing, newSuppressions);

  assert(merged.suppressions['module.ts']?.exports);
  assert(merged.suppressions['package.json']?.dependencies);
  assert(!merged.suppressions['unused.ts']);
});

test('applySuppressions filters matching issues', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const suppressions: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: {}, anotherUnused: {} },
      },
      'package.json': {
        dependencies: { 'unused-pkg': {} },
      },
    },
  };

  const result = applySuppressions(issues, suppressions);

  assert.equal(result.suppressedCount, 3);
  assert(!issues.exports['module.ts']);
  assert(issues.dependencies['package.json']['used-pkg']);
  assert(!issues.dependencies['package.json']['unused-pkg']);
});

test('applySuppressions respects expired until dates', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const suppressions: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: { until: '2020-01-01' }, anotherUnused: { until: '2020-01-01' } },
      },
    },
  };

  const result = applySuppressions(issues, suppressions);

  assert.equal(result.expiredCount, 2);
  assert.equal(result.suppressedCount, 0);
  assert(issues.exports['module.ts']['unusedExport']);
  assert(issues.exports['module.ts']['anotherUnused']);
});

test('applySuppressions keeps future until dates', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const suppressions: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: { until: '2099-12-31' } },
      },
    },
  };

  const result = applySuppressions(issues, suppressions);

  assert.equal(result.suppressedCount, 1);
  assert(!issues.exports['module.ts']['unusedExport']);
  assert(issues.exports['module.ts']['anotherUnused']);
});

test('pruneSuppressions removes expired entries', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const suppressions: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: { until: '2026-02-10' } },
      },
    },
  };

  const updated = pruneSuppressions(issues, suppressions);

  assert(!updated.suppressions['module.ts']);
});

test('mergeSuppressions combines two suppressions objects', () => {
  const existing: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: {} },
      },
    },
  };

  const incoming: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { anotherUnused: {} },
      },
      'package.json': {
        dependencies: { 'unused-pkg': {} },
      },
    },
  };

  const merged = mergeSuppressions(existing, incoming);

  assert.equal(merged.version, 1);
  assert(merged.suppressions['module.ts']);
  const symbols = merged.suppressions['module.ts'].exports;
  assert(symbols);
  assert(symbols['anotherUnused']);
  assert(symbols['unusedExport']);
  assert(merged.suppressions['package.json']);
});

test('generateSuppressions skips warn-level issue types', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const rules: Rules = { ...defaultRules, exports: 'warn' };
  const suppressions = generateSuppressions(issues, undefined, rules);

  assert(!suppressions.suppressions['module.ts']?.exports);
  assert(suppressions.suppressions['package.json']?.dependencies);
  assert(suppressions.suppressions['unused.ts']?.files);
});

test('applySuppressions skips warn-level issue types', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const suppressions: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: {}, anotherUnused: {} },
      },
      'package.json': {
        dependencies: { 'unused-pkg': {} },
      },
    },
  };

  const rules: Rules = { ...defaultRules, exports: 'warn' };
  const result = applySuppressions(issues, suppressions, rules);

  assert.equal(result.suppressedCount, 1);
  assert(issues.exports['module.ts']['unusedExport']);
  assert(issues.exports['module.ts']['anotherUnused']);
  assert(!issues.dependencies['package.json']['unused-pkg']);
});

test('mergeSuppressions preserves existing symbol metadata', () => {
  const existing: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: {} },
      },
    },
  };

  const incoming: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: { until: '2026-12-31' }, anotherUnused: { until: '2026-12-31' } },
      },
    },
  };

  const merged = mergeSuppressions(existing, incoming);

  const symbols = merged.suppressions['module.ts'].exports;
  assert(symbols);
  assert.equal(symbols['unusedExport'].until, undefined);
  assert.equal(symbols['anotherUnused'].until, '2026-12-31');
});

test('mergeSuppressions preserves until on new symbols', () => {
  const existing: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: { until: '2026-12-31' } },
      },
    },
  };

  const incoming: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { anotherUnused: { until: '2027-06-01' } },
      },
    },
  };

  const merged = mergeSuppressions(existing, incoming);

  const symbols = merged.suppressions['module.ts'].exports;
  assert(symbols);
  assert.equal(symbols['unusedExport'].until, '2026-12-31');
  assert.equal(symbols['anotherUnused'].until, '2027-06-01');
});

test('Regular run auto-prunes stale suppressions', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const existing: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: {}, anotherUnused: {}, alreadyFixed: {} },
      },
      'deleted-file.ts': {
        exports: { gone: {} },
      },
    },
  };

  const updated = pruneSuppressions(issues, existing);
  const isChanged = JSON.stringify(existing) !== JSON.stringify(updated);

  assert(isChanged);
  assert(updated.suppressions['module.ts']?.exports?.['unusedExport']);
  assert(updated.suppressions['module.ts']?.exports?.['anotherUnused']);
  assert(!updated.suppressions['module.ts']?.exports?.['alreadyFixed']);
  assert(!updated.suppressions['deleted-file.ts']);
});

test('Regular run detects no change when suppressions match', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const existing: Suppressions = {
    version: 1,
    suppressions: {
      'module.ts': {
        exports: { unusedExport: {}, anotherUnused: {} },
      },
    },
  };

  const updated = pruneSuppressions(issues, existing);
  const isChanged = JSON.stringify(existing) !== JSON.stringify(updated);

  assert(!isChanged);
});
