import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('WASI UTF-16 conversion preserves every code unit, BOMs, and chunk boundaries', () => {
  const module = { exports: {} };
  const emnapiString = {};
  const plugin = {};
  const runtime = {
    instantiateNapiModuleSync(input, options) {
      assert.equal(input, 'wasm');
      assert.equal(options.plugins[0], plugin);
      options.plugins[1]({ emnapiString });
    },
  };
  runInNewContext(readFileSync(new URL('./wasi-runtime.cjs', import.meta.url), 'utf8'), {
    module,
    require: name => (name === '@napi-rs/wasm-runtime' ? runtime : {}),
    Uint16Array,
  });
  module.exports.instantiateNapiModuleSync('wasm', { plugins: [plugin] });
  const units = new Uint16Array(65538);
  units[0] = 0xfeff;
  for (let i = 0; i < 65536; i++) units[i + 1] = i;
  units[65537] = 0xd800;
  const actual = emnapiString.utf16Decoder.decode(new Uint8Array(units.buffer));
  assert.equal(actual.length, units.length);
  for (let i = 0; i < units.length; i++) assert.equal(actual.charCodeAt(i), units[i]);
  const slice = new Uint8Array(units.buffer, 8190, 30);
  assert.equal(emnapiString.utf16Decoder.decode(slice), actual.slice(4095, 4110));
});
