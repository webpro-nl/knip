import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { setImmediate } from 'node:timers/promises';

if (!process.versions.bun && !process.features.typescript) {
  const { register } = await import('tsx/esm/api');
  register();
}

const require = createRequire(import.meta.url);
const mode = process.argv[2];
const resolverUrl = process.argv[3] ?? new URL('../../src/native-module-resolver.ts', import.meta.url).href;
const prefixOnly = ['node:sea', 'node:test/reporters'];
if (mode.startsWith('builtins')) {
  const module = require('node:module');
  module.builtinModules = Object.freeze(
    module.builtinModules.filter(name => !name.startsWith('node:') && name !== 'sea' && name !== 'test/reporters')
  );
  if (mode === 'builtins-disabled') {
    const isBuiltin = module.isBuiltin;
    module.isBuiltin = name => !prefixOnly.includes(name) && isBuiltin(name);
  }
  module.syncBuiltinESMExports();
}

const { NativeModuleResolver, createNativeResolverPlan } = await import(resolverUrl);
const { createCustomModuleResolver } = await import('../reference/typescript/resolve-module-names.ts');
const plan = createNativeResolverPlan(
  {
    availableWorkspaceDirs: [],
    workspacesByDir: new Map(),
    workspacesByPkgName: new Map(),
    workspacePackages: new Map(),
  },
  new Map(),
  new Map(),
  []
);

if (mode.startsWith('builtins')) {
  const { isBuiltin } = require('node:module');
  for (const name of prefixOnly) assert.equal(plan.builtinSpecifiers.includes(name), isBuiltin(name), name);
  const { nativeGetImportsAndExports, nativeGetImportsAndExportsWithResolver } =
    await import('../../src/native-analyzer.ts');
  const context = new NativeModuleResolver(plan);
  const host = createCustomModuleResolver({}, [], () => undefined);
  const file = '/workspace/builtins.ts';
  const source = 'import "node:sea"; import "node:test/reporters";';
  const options = {
    skipTypeOnly: false,
    isFixExports: false,
    isFixTypes: false,
    isReportExports: true,
    tags: [[], []],
  };
  const expected = nativeGetImportsAndExports(file, source, host, options, false, false, []);
  const actual = nativeGetImportsAndExportsWithResolver(file, source, context, options, false, false, []);
  assert.deepEqual(actual, expected);
} else if (mode === 'gc') {
  assert.equal(typeof globalThis.gc, 'function');
  const binding = require('knip/native');
  const { nativeResolverCache: cache } = await import('../../src/native-resolver-cache.ts');
  const { createNativeOptions } = await import('../../src/native-analyzer.ts');
  const options = createNativeOptions(
    { skipTypeOnly: false, isFixExports: false, isFixTypes: false, isReportExports: true, tags: [[], []] },
    false,
    false
  );
  const references = { baseline: [], raw: [], wrapper: [], withDebug: [], debugCallbacks: [], withBatch: [] };
  const create = () => {
    for (let index = 0; index < 100; index++) {
      references.baseline.push(new WeakRef(createCustomModuleResolver({}, [], () => undefined)));
      references.raw.push(new WeakRef(new binding.NativeModuleResolver(plan, cache, () => {})));
      references.wrapper.push(new WeakRef(new NativeModuleResolver(plan)));
      const callback = () => index;
      references.debugCallbacks.push(new WeakRef(callback));
      references.withDebug.push(new WeakRef(new NativeModuleResolver(plan, callback)));
      if (index < 8) {
        const resolver = new NativeModuleResolver(plan);
        const requests = Array.from({ length: 8 }, () => ({ filePath: '/workspace/missing.ts', options }));
        for (let batch = 0; batch < 3; batch++) {
          assert.ok(resolver.analyzeFiles(requests).every(result => result.unreadable));
        }
        references.withBatch.push(new WeakRef(resolver));
      }
    }
  };
  create();
  for (let index = 0; index < 10; index++) {
    await setImmediate();
    globalThis.gc();
  }
  const remaining = {};
  for (const [name, refs] of Object.entries(references)) remaining[name] = refs.filter(ref => ref.deref()).length;
  assert.deepEqual(remaining, { baseline: 0, raw: 0, wrapper: 0, withDebug: 0, debugCallbacks: 0, withBatch: 0 });
} else {
  assert.fail(`Unknown resolver test mode: ${mode}`);
}
