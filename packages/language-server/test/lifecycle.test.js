import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';
import { pathToFileURL } from 'node:url';
import { NOTIFICATION_MODULE_GRAPH_BUILT, SESSION_LOADING } from '../src/constants.js';
import { connection, knip } from './fixtures/lifecycle.js';

const serverUrl = new URL('../src/server.js', import.meta.url).href;
const fixtureUrl = new URL('./fixtures/lifecycle.js', import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.parentURL === serverUrl &&
      (specifier === 'vscode-languageserver/node' || specifier === 'knip/session')
    ) {
      return { url: fixtureUrl, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { LanguageServer } = await import('../src/server.js');
const cwd = mkdtempSync(path.join(tmpdir(), 'knip-ls-lifecycle-'));
after(() => rmSync(cwd, { recursive: true, force: true }));
const filePath = path.join(cwd, 'value.js');
const changes = { changes: [{ uri: pathToFileURL(filePath).href, type: 2 }] };
const changed = file => ({ changes: [{ uri: pathToFileURL(path.join(cwd, file)).href, type: 2 }] });
const updated = { duration: 1, mem: 1024 };
const config = { editor: { exports: { quickfix: { enabled: true } } } };
const options = { rules: { exports: 'warn' } };
const deferred = () => Promise.withResolvers();

const createSession = (name = 'current') => ({
  getIssues: () => ({ issues: {} }),
  getResults: () => ({ name }),
  describeFile: () => ({ name, metrics: {} }),
  describePackageJson: () => ({ dependenciesUsage: new Map([[name, { imports: [] }]]) }),
  handleFileChanges: async () => updated,
});

const setup = t => {
  t.mock.method(connection, 'listen', () => {});
  t.mock.method(connection.workspace, 'getConfiguration', async () => config);
  t.mock.method(connection.console, 'log', () => {});
  t.mock.method(connection.console, 'error', () => {});
  t.mock.method(connection, 'sendDiagnostics', () => {});
  t.mock.method(connection, 'sendNotification', () => {});
  t.mock.method(connection, 'onInitialized');
  t.mock.method(knip, 'createOptions', async () => options);
  t.mock.method(knip, 'createSession', async () => createSession());
  const originalConsole = { ...console };
  const server = new LanguageServer();
  Object.assign(console, originalConsole);
  server.cwd = cwd;
  return server;
};

test('stop cancels automatic startup while initialization configuration is pending', async t => {
  const server = setup(t);
  const pending = deferred();
  t.mock.method(server, 'getConfig', () => pending.promise);
  const start = t.mock.method(server, 'start');
  const initialized = connection.onInitialized.mock.calls[0].arguments[0]();
  server.stop();
  pending.resolve(config);
  await initialized;
  for (const call of start.mock.calls) await call.result;
  assert.equal(server.getResults(), null);
  assert.equal(connection.sendNotification.mock.callCount(), 0);
});

for (const phase of ['createOptions', 'createSession']) {
  test(`stop discards a pending ${phase}`, { timeout: 3000 }, async t => {
    const server = setup(t);
    const entered = deferred();
    const pending = deferred();
    t.mock.method(knip, phase, () => {
      entered.resolve();
      return pending.promise;
    });
    const start = server.start();
    await entered.promise;
    server.stop();
    pending.resolve(phase === 'createOptions' ? options : createSession('obsolete'));
    await start;
    assert.equal(server.getResults(), null);
    assert.equal(server.getFileDescriptor(filePath), SESSION_LOADING);
    assert.equal(connection.sendNotification.mock.callCount(), 0);
    assert.equal(connection.sendDiagnostics.mock.callCount(), 0);
    if (phase === 'createOptions') assert.equal(knip.createSession.mock.callCount(), 0);
  });

  test(`restart keeps the new session when obsolete ${phase} finishes last`, { timeout: 3000 }, async t => {
    const server = setup(t);
    const entered = deferred();
    const pending = deferred();
    let calls = 0;
    t.mock.method(knip, phase, () => {
      if (++calls > 1) return phase === 'createOptions' ? options : createSession();
      entered.resolve();
      return pending.promise;
    });
    const start = server.start();
    await entered.promise;
    await server.restart();
    assert.deepEqual(server.getResults(), { name: 'current' });
    pending.resolve(phase === 'createOptions' ? { rules: { exports: 'error' } } : createSession('obsolete'));
    await start;
    assert.deepEqual(server.getResults(), { name: 'current' });
    assert.deepEqual(server.rules, options.rules);
    assert.equal(connection.sendNotification.mock.callCount(), 1);
  });
}

test('overlapping starts retain the latest session and ignore obsolete startup errors', { timeout: 3000 }, async t => {
  const server = setup(t);
  const entered = deferred();
  const pending = deferred();
  let calls = 0;
  t.mock.method(knip, 'createSession', () => {
    if (++calls > 1) return createSession();
    entered.resolve();
    return pending.promise;
  });
  const start = server.start();
  await entered.promise;
  await server.start();
  pending.reject(new Error('obsolete startup failure'));
  await start;
  assert.deepEqual(server.getResults(), { name: 'current' });
  assert.equal(connection.console.error.mock.callCount(), 0);
  assert.equal(connection.sendNotification.mock.callCount(), 1);
});

for (const file of ['knip.json', 'package.json']) {
  test(`${file} change restarts after a failed start`, { timeout: 3000 }, async t => {
    const server = setup(t);
    let calls = 0;
    t.mock.method(knip, 'createOptions', async () => {
      if (++calls === 1) throw new Error('invalid config');
      return options;
    });
    await server.start();
    assert.equal(server.getResults(), null);
    assert.equal(connection.console.error.mock.callCount(), 1);
    await server.handleFileChanges(changed(file));
    assert.equal(calls, 2);
    assert.deepEqual(server.getResults(), { name: 'current' });
    assert.equal(connection.sendNotification.mock.callCount(), 1);
  });
}

test('config change does not start a server stopped after a failed start', { timeout: 3000 }, async t => {
  const server = setup(t);
  let calls = 0;
  t.mock.method(knip, 'createOptions', async () => {
    calls++;
    throw new Error('invalid config');
  });
  await server.start();
  server.stop();
  await server.handleFileChanges(changed('knip.json'));
  assert.equal(calls, 1);
  assert.equal(server.getResults(), null);
  assert.equal(connection.sendNotification.mock.callCount(), 0);
});

test('source change after a failed start neither restarts nor updates', { timeout: 3000 }, async t => {
  const server = setup(t);
  let calls = 0;
  t.mock.method(knip, 'createOptions', async () => {
    calls++;
    throw new Error('invalid config');
  });
  await server.start();
  await server.handleFileChanges(changes);
  assert.equal(calls, 1);
  assert.equal(server.getResults(), null);
  assert.equal(connection.console.error.mock.callCount(), 1);
});

test('graph updates invalidate descriptors requested during the update and notify without diagnostics', async t => {
  const server = setup(t);
  let session = createSession('before');
  const pending = deferred();
  server.session = {
    ...session,
    describeFile: () => session.describeFile(),
    describePackageJson: () => session.describePackageJson(),
    handleFileChanges: () => pending.promise,
  };
  const update = server.handleFileChanges(changes);
  assert.equal(server.getFileDescriptor(filePath).name, 'before');
  assert.deepEqual(Object.keys(server.getPackageJsonDescriptor().dependenciesUsage), ['before']);
  session = createSession('after');
  pending.resolve(updated);
  await update;
  assert.equal(server.getFileDescriptor(filePath).name, 'after');
  assert.deepEqual(Object.keys(server.getPackageJsonDescriptor().dependenciesUsage), ['after']);
  assert.equal(connection.sendDiagnostics.mock.callCount(), 0);
  assert.deepEqual(connection.sendNotification.mock.calls[0]?.arguments, [
    NOTIFICATION_MODULE_GRAPH_BUILT,
    { duration: updated.duration },
  ]);
});

test('stop clears package descriptors before another session starts', async t => {
  const server = setup(t);
  server.session = createSession('obsolete');
  assert.deepEqual(Object.keys(server.getPackageJsonDescriptor().dependenciesUsage), ['obsolete']);
  server.stop();
  await server.start();
  assert.deepEqual(Object.keys(server.getPackageJsonDescriptor().dependenciesUsage), ['current']);
});

for (const replaced of [false, true]) {
  for (const phase of ['update', 'configuration']) {
    test(`discard an obsolete update awaiting ${phase} after ${replaced ? 'replacement' : 'stop'}`, async t => {
      const server = setup(t);
      const pending = deferred();
      const entered = deferred();
      const old = createSession('obsolete');
      server.session = old;
      if (phase === 'update') old.handleFileChanges = () => pending.promise;
      else {
        t.mock.method(server, 'getConfig', () => {
          entered.resolve();
          return pending.promise;
        });
      }
      const update = server.handleFileChanges(changes);
      if (phase === 'configuration') await entered.promise;
      server.stop();
      if (replaced) {
        server.session = createSession();
        server.session.getIssues = () => ({ issues: { files: { [filePath]: { file: { type: 'files', filePath } } } } });
        server.getFileDescriptor(filePath);
        server.getPackageJsonDescriptor();
      }
      const file = server.fileCache;
      const manifest = server.packageJsonCache;
      pending.resolve(phase === 'update' ? updated : config);
      await update;
      assert.equal(server.fileCache, file);
      assert.equal(server.packageJsonCache, manifest);
      assert.equal(connection.sendDiagnostics.mock.callCount(), 0);
      assert.equal(connection.sendNotification.mock.callCount(), 0);
      assert.equal(connection.console.error.mock.callCount(), 0);
    });
  }
}

test('obsolete update errors cannot affect the replacement session', async t => {
  const server = setup(t);
  await server.start();
  const pending = deferred();
  server.session.handleFileChanges = () => pending.promise;
  const update = server.handleFileChanges(changes);
  await server.restart();
  pending.reject(new Error('obsolete update failure'));
  await update;
  assert.deepEqual(server.getResults(), { name: 'current' });
  assert.deepEqual(server.rules, options.rules);
  assert.equal(connection.console.error.mock.callCount(), 0);
  assert.equal(connection.sendNotification.mock.callCount(), 2);
});
