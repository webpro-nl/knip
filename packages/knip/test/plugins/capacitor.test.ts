import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/capacitor');

test('Find dependencies with the Capacitor plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['capacitor.config.json']['@capacitor-community/http']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/android']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/app']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/splash-screen']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/status-bar']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/storage']);
  assert(issues.unlisted['capacitor.config.json']['cordova-plugin-inappbrowser']);

  assert(issues.unlisted['capacitor.config.ts']['@capacitor-community/http']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/app']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/ios']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/splash-screen']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/status-bar']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/storage']);
  assert(issues.unlisted['capacitor.config.ts']['cordova-plugin-inappbrowser']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 14,
    processed: 1,
    total: 1,
  });
});
