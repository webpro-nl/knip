import assert from 'node:assert/strict';
import test from 'node:test';
import { _load as load } from '../../src/util/loader.js';
import { join } from '../../src/util/path.js';
import { resolve } from '../helpers/resolve.js';

test('Should load JSON5 files', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'config.json5'));
  assert.equal(config.name, 'test-config');
  assert.equal(config.plugins.length, 2);
  assert.equal(config.enabled, true);
});

test('Should load comprehensive JSON5 file with all features', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'comprehensive.json5'));

  // Objects: Unquoted keys
  assert.equal(config.unquotedKey, 'This key has no quotes');
  assert.equal(config.$dollarKey, 'Keys can start with dollar sign');
  assert.equal(config._underscoreKey, 'Keys can start with underscore');
  assert.equal(config.key123, 'Keys can contain numbers');

  // Strings: Single and double quotes
  assert.equal(config.singleQuoted, 'I can use "double quotes" inside single quotes');
  assert.equal(config.doubleQuoted, "I can use 'single quotes' inside double quotes");

  // Strings: Multi-line
  assert.equal(config.multiLine, 'This string spans multiple lines by escaping the newline characters');

  // Strings: Character escapes
  assert.equal(config.escapes.apostrophe, "'");
  assert.equal(config.escapes.quotationMark, '"');
  assert.equal(config.escapes.reverseSolidus, '\\');
  assert.equal(config.escapes.backspace, '\b');
  assert.equal(config.escapes.formFeed, '\f');
  assert.equal(config.escapes.lineFeed, '\n');
  assert.equal(config.escapes.carriageReturn, '\r');
  assert.equal(config.escapes.horizontalTab, '\t');
  assert.equal(config.escapes.verticalTab, '\v');
  assert.equal(config.escapes.nullChar, '\0');
  assert.equal(config.escapes.hexEscape, 'A');
  assert.equal(config.escapes.unicodeEscape, 'A');

  // Numbers: Hexadecimal
  assert.equal(config.hexNumbers.positiveHex, 0xdecaf);
  assert.equal(config.hexNumbers.negativeHex, -0xc0ffee);
  assert.equal(config.hexNumbers.upperCaseHex, 0xbeef);

  // Numbers: Leading and trailing decimal points
  assert.equal(config.decimals.leadingDecimalPoint, 0.8675309);
  assert.equal(config.decimals.trailingDecimalPoint, 8675309);
  assert.equal(config.decimals.bothDecimalPoints, 3.14);

  // Numbers: Explicit plus sign
  assert.equal(config.explicitPlus, 1);
  assert.equal(config.explicitPlusDecimal, 42.5);

  // Numbers: IEEE 754 special values
  assert.equal(config.specialNumbers.positiveInfinity, Infinity);
  assert.equal(config.specialNumbers.negativeInfinity, -Infinity);
  assert(Number.isNaN(config.specialNumbers.notANumber));
  assert.equal(config.specialNumbers.plusInfinity, Infinity);

  // Numbers: Scientific notation
  assert.equal(config.scientific.simple, 1e10);
  assert.equal(config.scientific.withPlus, 1e10);
  // biome-ignore lint/correctness/noPrecisionLoss: Test fixture
  assert.equal(config.scientific.withMinus, 123e-456);
  assert.equal(config.scientific.decimal, 1.23e10);

  // Arrays: Trailing commas
  assert.deepEqual(config.arrayWithTrailing, [1, 2, 3]);

  // Arrays: Mixed types
  assert.equal(config.mixedArray.length, 6);
  assert.equal(config.mixedArray[0], 'string');
  assert.equal(config.mixedArray[1], 42);
  assert.equal(config.mixedArray[2], true);
  assert.equal(config.mixedArray[3], null);
  assert.deepEqual(config.mixedArray[4], { nested: 'object' });
  assert.deepEqual(config.mixedArray[5], [1, 2, 3]);

  // Objects: Nested with trailing commas
  assert.equal(config.nested.level1.level2.value, 'deeply nested');

  // Comments work
  assert.equal(config.commentsWork, true);

  // Trailing comma in object
  assert.equal(config.lastProperty, 'trailing comma after this');
});

// Individual JSON5 feature tests
test('JSON5: Unquoted object keys', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'unquoted-keys.json5'));
  assert.equal(config.unquotedKey, 'value');
  assert.equal(config.$dollarKey, 'dollar');
  assert.equal(config._underscoreKey, 'underscore');
  assert.equal(config.key123, 'with numbers');
});

test('JSON5: Single-quoted strings', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'single-quotes.json5'));
  assert.equal(config.singleQuoted, 'I can use "double quotes" inside');
  assert.equal(config.mixed, "I can use 'single quotes' inside double");
});

test('JSON5: Multi-line strings', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'multiline-strings.json5'));
  assert.equal(config.multiLine, 'This string spans multiple lines by escaping the newline characters');
});

test('JSON5: Character escapes (hex, unicode)', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'character-escapes.json5'));
  assert.equal(config.hexEscape, 'A');
  assert.equal(config.unicodeEscape, 'A');
  assert.equal(config.verticalTab, '\v');
});

test('JSON5: Hexadecimal numbers', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'hex-numbers.json5'));
  assert.equal(config.positiveHex, 0xdecaf);
  assert.equal(config.negativeHex, -0xc0ffee);
  assert.equal(config.upperCaseHex, 0xbeef);
});

test('JSON5: Leading and trailing decimal points', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'decimal-points.json5'));
  assert.equal(config.leadingDecimal, 0.8675309);
  assert.equal(config.trailingDecimal, 8675309);
  assert.equal(config.normalDecimal, 3.14);
});

test('JSON5: Explicit plus sign on numbers', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'explicit-plus.json5'));
  assert.equal(config.explicitPlus, 1);
  assert.equal(config.explicitPlusDecimal, 42.5);
});

test('JSON5: IEEE 754 special values (Infinity, NaN)', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'special-numbers.json5'));
  assert.equal(config.positiveInfinity, Infinity);
  assert.equal(config.negativeInfinity, -Infinity);
  assert(Number.isNaN(config.notANumber));
  assert.equal(config.plusInfinity, Infinity);
});

test('JSON5: Trailing commas in objects', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'trailing-commas-object.json5'));
  assert.equal(config.first, 'value1');
  assert.equal(config.second, 'value2');
  assert.equal(config.third, 'value3');
});

test('JSON5: Trailing commas in arrays', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'trailing-commas-array.json5'));
  assert.deepEqual(config.array, [1, 2, 3]);
});

test('JSON5: Comments (single-line and multi-line)', async () => {
  const cwd = resolve('fixtures/load-json5');
  const config = await load(join(cwd, 'comments.json5'));
  assert.equal(config.singleLine, true);
  assert.equal(config.multiLine, true);
  assert.equal(config.inline, 'value');
});
