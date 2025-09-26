import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/capacitor');

test('Find dependencies with the Capacitor plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['capacitor.config.json']['@capacitor-community/http']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/android']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/ios']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/app']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/splash-screen']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/status-bar']);
  assert(issues.unlisted['capacitor.config.json']['@capacitor/storage']);
  assert(issues.unlisted['capacitor.config.json']['cordova-plugin-inappbrowser']);

  assert(issues.unlisted['capacitor.config.ts']['@capacitor-community/http']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/app']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/android']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/ios']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/splash-screen']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/status-bar']);
  assert(issues.unlisted['capacitor.config.ts']['@capacitor/storage']);
  assert(issues.unlisted['capacitor.config.ts']['cordova-plugin-inappbrowser']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 16,
    processed: 1,
    total: 1,
  });
});
