import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { analyzeMiniprogramProject } from '../../../src/plugins/miniprogram/utils.js';
import { join, resolve } from '../../../src/util/path.js';

const fixturesDir = resolve('packages/knip/fixtures/plugins/miniprogram/app-project');

test('should analyze miniprogram project', () => {
  const result = analyzeMiniprogramProject(fixturesDir);

  // Check pages
  assert.equal(result.pages.length, 1);
  assert.equal(result.pages[0].specifier, 'pages/index/index');
  assert.equal(result.pages[0].resolvedPath, join(fixturesDir, 'pages/index/index'));
  assert.equal(result.pages[0].containingFile, join(fixturesDir, 'app.json'));

  // Check components
  assert.equal(result.components.length, 5);

  // Check global components from app.json
  const missingHeader = result.components.find(c => c.specifier === '/components/missing-header/index');
  assert.ok(missingHeader);
  assert.equal(missingHeader.resolvedPath, join(fixturesDir, '/components/missing-header/index'));
  assert.equal(missingHeader.containingFile, join(fixturesDir, 'app.json'));

  const usedFooter = result.components.find(c => c.specifier === '/components/used-footer/index');
  assert.ok(usedFooter);
  assert.equal(usedFooter.resolvedPath, join(fixturesDir, '/components/used-footer/index'));
  assert.equal(usedFooter.containingFile, join(fixturesDir, 'app.json'));

  // Check page components
  const missingButton = result.components.find(c => c.specifier === '@components/missing-button');
  assert.ok(missingButton);
  assert.equal(missingButton.resolvedPath, join(fixturesDir, 'components/missing-button'));
  assert.equal(missingButton.containingFile, join(fixturesDir, 'pages/index/index.json'));

  const missingHelper = result.components.find(c => c.specifier === '~/utils/missing-helper');
  assert.ok(missingHelper);
  assert.equal(missingHelper.resolvedPath, join(fixturesDir, 'utils/missing-helper'));
  assert.equal(missingHelper.containingFile, join(fixturesDir, 'pages/index/index.json'));

  const pageFooter = result.components.find(c => c.specifier === './missing-footer');
  assert.ok(pageFooter);
  assert.equal(pageFooter.resolvedPath, join(fixturesDir, 'missing-footer'));
  assert.equal(pageFooter.containingFile, join(fixturesDir, 'pages/index/index.json'));

  // Check workers
  assert.equal(result.workers?.length, 1);
  assert.equal(result.workers?.[0].specifier, 'workers/missing-worker');
  assert.equal(result.workers?.[0].resolvedPath, join(fixturesDir, 'workers/missing-worker'));
  assert.equal(result.workers?.[0].containingFile, join(fixturesDir, 'app.json'));

  // Check tabBar icons
  assert.equal(result.tabBarIcons?.length, 2);
  const iconPath = result.tabBarIcons?.find(i => i.specifier === 'images/missing-icon.png');
  assert.ok(iconPath);
  assert.equal(iconPath.resolvedPath, join(fixturesDir, 'images/missing-icon.png'));
  assert.equal(iconPath.containingFile, join(fixturesDir, 'app.json'));

  const selectedIconPath = result.tabBarIcons?.find(i => i.specifier === 'images/missing-icon-selected.png');
  assert.ok(selectedIconPath);
  assert.equal(selectedIconPath.resolvedPath, join(fixturesDir, 'images/missing-icon-selected.png'));
  assert.equal(selectedIconPath.containingFile, join(fixturesDir, 'app.json'));
});

test('should handle path aliases', () => {
  const result = analyzeMiniprogramProject(fixturesDir, {
    paths: {
      '@components': ['components'],
      '@utils': ['utils'],
      '~': ['.'],
    },
  });

  // Check aliased components
  assert.equal(result.components.length, 5);

  // Check global components from app.json
  const missingHeader = result.components.find(c => c.specifier === '/components/missing-header/index');
  assert.ok(missingHeader);
  assert.equal(missingHeader.resolvedPath, join(fixturesDir, '/components/missing-header/index'));
  assert.equal(missingHeader.containingFile, join(fixturesDir, 'app.json'));

  const usedFooter = result.components.find(c => c.specifier === '/components/used-footer/index');
  assert.ok(usedFooter);
  assert.equal(usedFooter.resolvedPath, join(fixturesDir, '/components/used-footer/index'));
  assert.equal(usedFooter.containingFile, join(fixturesDir, 'app.json'));

  // Check page components
  const missingButton = result.components.find(c => c.specifier === '@components/missing-button');
  assert.ok(missingButton);
  assert.equal(missingButton.resolvedPath, join(fixturesDir, 'components/missing-button'));
  assert.equal(missingButton.containingFile, join(fixturesDir, 'pages/index/index.json'));

  const missingHelper = result.components.find(c => c.specifier === '~/utils/missing-helper');
  assert.ok(missingHelper);
  assert.equal(missingHelper.resolvedPath, join(fixturesDir, 'utils/missing-helper'));
  assert.equal(missingHelper.containingFile, join(fixturesDir, 'pages/index/index.json'));

  const pageFooter = result.components.find(c => c.specifier === './missing-footer');
  assert.ok(pageFooter);
  assert.equal(pageFooter.resolvedPath, join(fixturesDir, 'missing-footer'));
  assert.equal(pageFooter.containingFile, join(fixturesDir, 'pages/index/index.json'));
});
