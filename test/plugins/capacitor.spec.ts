import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as capacitor from '../../src/plugins/capacitor/index.js';

const cwd = path.resolve('test/fixtures/plugins/capacitor');

test('Unused dependencies in Capacitor configuration (ts)', async () => {
  const configFilePath = path.join(cwd, 'capacitor.config.ts');
  const dependencies = await capacitor.findDependencies(configFilePath);
  assert.deepEqual(dependencies, [
    '@capacitor-community/http',
    '@capacitor/app',
    '@capacitor/ios',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
    '@capacitor/storage',
    'cordova-plugin-inappbrowser',
  ]);
});

test('Unused dependencies in Capacitor configuration (json)', async () => {
  const configFilePath = path.join(cwd, 'capacitor.config.json');
  const dependencies = await capacitor.findDependencies(configFilePath);
  assert.deepEqual(dependencies, [
    '@capacitor-community/http',
    '@capacitor/android',
    '@capacitor/app',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
    '@capacitor/storage',
    'cordova-plugin-inappbrowser',
  ]);
});
