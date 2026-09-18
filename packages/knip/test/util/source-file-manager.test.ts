import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import type { Compiler } from '../../src/compilers/types.ts';
import { SourceFileManager } from '../../src/typescript/SourceFileManager.ts';
import { ConfigurationError, isKnownError } from '../../src/util/errors.ts';

const filePath = '/project/component.source';

const createManager = (compiler?: Compiler, isSession = false) => {
  const manager = new SourceFileManager({ compilers: new Map(compiler ? [['.source', compiler]] : []), isSession });
  manager.readRawFile = () => '<component />';
  return manager;
};

const createPending = () => {
  let resolve: (value: string) => void = assert.fail;
  let reject: (reason: Error) => void = assert.fail;
  const promise = new Promise<string>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

test('Should return raw source and synchronous compiler output without a Promise', () => {
  assert.equal(createManager().loadSourceText(filePath), '<component />');
  let calls = 0;
  const manager = createManager((source, path) => {
    calls++;
    assert.equal(source, '<component />');
    assert.equal(path, '/project/component.source');
    return 'export const component = true;';
  });
  assert.equal(manager.loadSourceText(filePath), 'export const component = true;');
  assert.equal(manager.loadSourceText(filePath), 'export const component = true;');
  assert.equal(calls, 1);
});

test('Should share pending compilation and cache its settled source', async () => {
  let calls = 0;
  const manager = createManager(() => {
    calls++;
    return Promise.resolve('export const component = true;');
  });
  const first = manager.loadSourceText(filePath);
  assert.ok(first instanceof Promise);
  assert.equal(manager.loadSourceText(filePath), first);
  assert.equal(await first, 'export const component = true;');
  assert.equal(manager.loadSourceText(filePath), 'export const component = true;');
  assert.equal(calls, 1);
});

test('Should accept custom thenables and promises from another realm', async () => {
  const thenableManager = createManager(() => ({
    then(onfulfilled, onrejected) {
      return Promise.resolve('export const custom = true;').then(onfulfilled, onrejected);
    },
  }));
  assert.equal(await thenableManager.loadSourceText(filePath), 'export const custom = true;');
  const crossRealmPromise: Promise<string> = runInNewContext('Promise.resolve("export const crossRealm = true;")');
  assert.equal(crossRealmPromise instanceof Promise, false);
  assert.equal(
    await createManager(() => crossRealmPromise).loadSourceText(filePath),
    'export const crossRealm = true;'
  );
});

test('Should reject invalid immediate and settled compiler results', async () => {
  const expected = {
    constructor: ConfigurationError,
    message:
      'Compiler for .source returned number for /project/component.source; expected a string or PromiseLike<string>',
  };
  // @ts-expect-error Invalid compiler results must also be checked at runtime.
  assert.throws(() => createManager(() => 42).loadSourceText(filePath), expected);
  // @ts-expect-error Invalid compiler results must also be checked at runtime.
  await assert.rejects(createManager(() => Promise.resolve(42)).loadSourceText(filePath), expected);
  // @ts-expect-error Invalid compiler results must also be checked at runtime.
  const objectResult = createManager(() => ({})).loadSourceText(filePath);
  assert.ok(objectResult instanceof Promise);
  await assert.rejects(objectResult, {
    constructor: ConfigurationError,
    message:
      'Compiler for .source returned object for /project/component.source; expected a string or PromiseLike<string>',
  });
});

test('Should contextualize synchronous compiler failures with the original cause', () => {
  const cause = new Error('Cannot compile component');
  const manager = createManager(() => {
    throw cause;
  });
  assert.throws(
    () => manager.loadSourceText(filePath),
    error => {
      assert.ok(error instanceof Error);
      assert.equal(error.constructor.name, 'CompilerError');
      assert.equal(error.message, 'Compiler for .source failed (/project/component.source)');
      assert.equal(error.cause, cause);
      assert.equal(isKnownError(error), true);
      return true;
    }
  );
});

test('Should assimilate a getter-backed thenable exactly once', async () => {
  const settled = Promise.resolve('export const component = true;');
  let reads = 0;
  const manager = createManager(() => ({
    get then() {
      if (++reads > 1) throw new Error('The then getter was already read');
      return settled.then.bind(settled);
    },
  }));
  assert.equal(await manager.loadSourceText(filePath), 'export const component = true;');
  assert.equal(reads, 1);
});

test('Should contextualize a throwing then getter', async () => {
  const cause = new Error('Cannot access then');
  const manager = createManager(() => ({
    get then(): never {
      throw cause;
    },
  }));
  const result = manager.loadSourceText(filePath);
  assert.ok(result instanceof Promise);
  await assert.rejects(result, {
    message: 'Compiler for .source failed (/project/component.source)',
    cause,
  });
  assert.equal(manager.sourceTextCache.has(filePath), false);
});

test('Should retry invalid settled compiler results', async () => {
  let calls = 0;
  const manager = createManager(
    // @ts-expect-error Invalid compiler results must also be checked at runtime.
    () => Promise.resolve(++calls === 1 ? undefined : 'export const recovered = true;'),
    true
  );
  const first = manager.loadSourceText(filePath);
  assert.ok(first instanceof Promise);
  await assert.rejects(first, {
    constructor: ConfigurationError,
    message:
      'Compiler for .source returned undefined for /project/component.source; expected a string or PromiseLike<string>',
  });
  assert.equal(manager.hasChanged(filePath), true);
  assert.equal(await manager.loadSourceText(filePath), 'export const recovered = true;');
  assert.equal(manager.hasChanged(filePath), false);
  assert.equal(calls, 2);
});

test('Should observe rejected compiler results and allow a later attempt', async () => {
  const cause = new Error('Cannot compile component');
  let calls = 0;
  const manager = createManager(() => {
    calls++;
    return calls === 1 ? Promise.reject(cause) : Promise.resolve('export const recovered = true;');
  });
  const first = manager.loadSourceText(filePath);
  assert.ok(first instanceof Promise);
  await assert.rejects(first, error => {
    assert.ok(error instanceof Error);
    assert.equal(error.constructor.name, 'CompilerError');
    assert.equal(error.message, 'Compiler for .source failed (/project/component.source)');
    assert.equal(error.cause, cause);
    assert.equal(isKnownError(error), true);
    return true;
  });
  assert.equal(manager.sourceTextCache.has(filePath), false);
  assert.equal(await manager.loadSourceText(filePath), 'export const recovered = true;');
  assert.equal(calls, 2);
});

test('Should not restore stale source after invalidating an in-flight compilation', async () => {
  const pending = createPending();
  let calls = 0;
  const manager = createManager(() => {
    calls++;
    return calls === 1 ? pending.promise : Promise.resolve('export const current = true;');
  });
  const first = manager.loadSourceText(filePath);
  manager.invalidate(filePath);
  assert.equal(await manager.loadSourceText(filePath), 'export const current = true;');
  pending.resolve('export const stale = true;');
  assert.equal(await first, 'export const stale = true;');
  assert.equal(manager.loadSourceText(filePath), 'export const current = true;');
  assert.equal(calls, 2);
});

test('Should not clear a newer compilation when an invalidated result rejects', async () => {
  const stale = createPending();
  const current = createPending();
  let calls = 0;
  const manager = createManager(() => (++calls === 1 ? stale.promise : current.promise));
  const first = manager.loadSourceText(filePath);
  assert.ok(first instanceof Promise);
  const rejected = assert.rejects(first, { message: 'Compiler for .source failed (/project/component.source)' });
  manager.invalidate(filePath);
  const second = manager.loadSourceText(filePath);
  stale.reject(new Error('Stale compilation failed'));
  await rejected;
  assert.equal(manager.loadSourceText(filePath), second);
  current.resolve('export const current = true;');
  assert.equal(await second, 'export const current = true;');
  assert.equal(manager.loadSourceText(filePath), 'export const current = true;');
  assert.equal(calls, 2);
});

test('Should preserve empty source for foreign files without a compiler and missing files', () => {
  const manager = createManager();
  manager.readRawFile = () => {
    assert.fail('Foreign files without a compiler should not be read');
  };
  assert.equal(manager.loadSourceText('/project/styles.css'), '');
  manager.readRawFile = () => undefined;
  assert.equal(manager.loadSourceText('/project/missing.ts'), '');
});

test('Should compare session changes with raw source after compiled source is evicted', () => {
  const manager = createManager(() => 'export const component = true;', true);
  assert.equal(manager.hasChanged(filePath), true);
  manager.loadSourceText(filePath);
  assert.equal(manager.hasChanged(filePath), false);
  manager.sourceTextCache.delete(filePath);
  assert.equal(manager.hasChanged(filePath), false);
  manager.readRawFile = () => '<changed />';
  assert.equal(manager.hasChanged(filePath), true);
  manager.invalidate(filePath);
  assert.equal(manager.hasChanged(filePath), true);
  manager.loadSourceText(filePath);
  assert.equal(manager.hasChanged(filePath), false);
  manager.readRawFile = () => undefined;
  assert.equal(manager.hasChanged(filePath), true);
});

test('Should retain raw fingerprints only for current successful session loads', async () => {
  const stale = createPending();
  let calls = 0;
  const manager = createManager(
    () => (++calls === 1 ? stale.promise : Promise.resolve('export const current = true;')),
    true
  );
  const first = manager.loadSourceText(filePath);
  assert.equal(manager.hasChanged(filePath), true);
  manager.invalidate(filePath);
  manager.readRawFile = () => '<changed />';
  assert.equal(await manager.loadSourceText(filePath), 'export const current = true;');
  assert.equal(manager.hasChanged(filePath), false);
  stale.resolve('export const stale = true;');
  await first;
  assert.equal(manager.hasChanged(filePath), false);
});

test('Should not track raw content for one-shot analysis', () => {
  const manager = createManager();
  manager.loadSourceText(filePath);
  manager.readRawFile = () => assert.fail('One-shot analysis should not retain raw fingerprints');
  assert.equal(manager.hasChanged(filePath), true);
});
