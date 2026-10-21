import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import targets from '../native/targets.cjs';

const loader = readFileSync(new URL('../native/index.cjs', import.meta.url), 'utf8');

function load(requireBinding, options = {}) {
  const module = { exports: {} };
  runInNewContext(loader, {
    module,
    process: { platform: 'darwin', arch: 'arm64', env: {}, versions: {}, ...options },
    require: name => (name === './targets.cjs' ? targets : requireBinding(name)),
  });
  return module.exports;
}

test('keeps native loading first without loading the WASI runtime', () => {
  const binding = {};
  assert.equal(
    load(name => {
      assert.equal(name, './knip-native.aarch64-apple-darwin.node');
      return binding;
    }),
    binding
  );
});

test('falls back when addons are disabled, including WebContainers and unmatched platforms', () => {
  for (const options of [{}, { versions: { webcontainer: '1' } }, { platform: 'unmatched' }]) {
    const binding = {};
    assert.equal(
      load(name => {
        if (name.endsWith('.node'))
          throw Object.assign(new Error('native addons disabled'), { code: 'ERR_DLOPEN_DISABLED' });
        assert.equal(name, './knip-native.wasi.cjs');
        return binding;
      }, options),
      binding
    );
  }
});

test('honors explicit WASI selection without treating false strings as enabled', () => {
  for (const force of ['true', 'error', 'false', '0', '']) {
    load(
      name => {
        assert.equal(
          name,
          force === 'true' || force === 'error' ? './knip-native.wasi.cjs' : './knip-native.aarch64-apple-darwin.node'
        );
        return {};
      },
      { env: { NAPI_RS_FORCE_WASI: force } }
    );
  }
});

test('preserves original native and WASI errors when both fail', () => {
  const nativeError = new Error('native ABI mismatch');
  const wasiError = new Error('WASI artifact missing');
  assert.throws(
    () =>
      load(name => {
        throw name.endsWith('.node') ? nativeError : wasiError;
      }),
    error => {
      assert.equal(error.name, 'AggregateError');
      assert.equal(error.cause, nativeError);
      assert.equal(error.errors[0], nativeError);
      assert.equal(error.errors[1], wasiError);
      return true;
    }
  );
});
