import assert from 'node:assert/strict';
import test from 'node:test';
import { _load as load } from '../../src/util/loader.js';
import { join } from '../../src/util/path.js';
import { resolve } from '../helpers/resolve.js';

// Standard JSON backward compatibility tests
test('JSON: Standard JSON parsing', async () => {
  const cwd = resolve('fixtures/load-json');
  const config = await load(join(cwd, 'standard.json'));
  assert.equal(config.name, 'test-standard-json');
  assert.equal(config.version, '1.0.0');
  assert.equal(config.enabled, true);
  assert.equal(config.count, 42);
  assert.equal(config.nested.key, 'value');
  assert.deepEqual(config.array, [1, 2, 3]);
});

test('JSON: Unicode and special characters', async () => {
  const cwd = resolve('fixtures/load-json');
  const config = await load(join(cwd, 'unicode.json'));
  assert.equal(config.unicode, 'Hello 世界 🌍');
  assert.equal(config.escaped, 'Line 1\nLine 2\tTabbed');
  assert.equal(config.special, 'Quote: " Backslash: \\ Slash: /');
});

test('JSON: Number formats', async () => {
  const cwd = resolve('fixtures/load-json');
  const config = await load(join(cwd, 'numbers.json'));
  assert.equal(config.integer, 42);
  assert.equal(config.negative, -17);
  // biome-ignore lint/suspicious/noApproximativeNumericConstant: Test fixture
  assert.equal(config.decimal, 3.14159);
  assert.equal(config.scientific, 0.000123);
  assert.equal(config.scientificPos, 50000000000);
  assert.equal(config.zero, 0);
});

test('JSON: Edge cases', async () => {
  const cwd = resolve('fixtures/load-json');
  const config = await load(join(cwd, 'edge-cases.json'));
  assert.equal(config.emptyString, '');
  assert.deepEqual(config.emptyObject, {});
  assert.deepEqual(config.emptyArray, []);
  assert.equal(config.nullValue, null);
  assert.equal(config.boolTrue, true);
  assert.equal(config.boolFalse, false);
  assert.equal(config.deeplyNested.level1.level2.level3.value, 'deep');
});
