import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../../src/index.js';
import { join, resolve } from '../../../src/util/path.js';
import baseArguments from '../../helpers/baseArguments.js';
import baseCounters from '../../helpers/baseCounters.js';

test('Mini Program app project dependencies', async () => {
  const cwd = resolve('fixtures/plugins/miniprogram/app-project');
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  // Verify unresolved dependencies (files referenced but don't exist)
  assert(issues.unresolved['app.wxss']?.['/styles/missing-theme']);
  assert(issues.unresolved['pages/index/helper.wxs']?.['./missing-common.wxs']);
  assert(issues.unresolved['pages/index/index.wxml']?.['/templates/missing-list.wxml']);
  assert(issues.unresolved['pages/index/index.wxml']?.['/templates/used-list.wxml']);
  assert(issues.unresolved['pages/index/index.wxml']?.['/templates/used-item.wxml']);
  assert(issues.unresolved['pages/index/index.wxml']?.['/templates/missing-item.wxml']);
  assert(issues.unresolved['pages/index/index.wxml']?.['/utils/missing-format.wxs']);
  assert(issues.unresolved['pages/index/index.wxss']?.['/styles/missing-theme.wxss']);
  assert(issues.unresolved['pages/index/index.ts']?.['~/utils/missing-date']);

  // Verify unreferenced files (files that exist but aren't used)
  const unreferencedFiles = new Set([
    join(cwd, 'styles/unused-theme.wxss'),
    join(cwd, 'wxs/unused-format.wxs'),
    join(cwd, 'templates/unused-card.wxml'),
    join(cwd, 'templates/used-item.wxml'),
    join(cwd, 'components/unused-button/index.json'),
    join(cwd, 'components/unused-button/index.js'),
    join(cwd, 'components/unused-counter/index.json'),
    join(cwd, 'components/unused-counter/index.ts'),
  ]);

  // All unreferenced files should be reported
  for (const file of unreferencedFiles) {
    assert(issues.files.has(file), `Expected ${file} to be reported as unreferenced`);
  }

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 9, // Number of unreferenced files
    unresolved: 10, // Number of missing files that are referenced
    processed: 23,
    total: 23, // Total files including both referenced and unreferenced
    devDependencies: 0, // No problematic dev dependencies (miniprogram-api-typings is an allowed dependency)
    unlisted: 0,
  });
});
