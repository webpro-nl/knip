import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NOTIFICATION_MODULE_GRAPH_BUILT, REQUEST_RESULTS } from '../src/constants.js';

const startServer = (cwd, t) => {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../src/cli.js', import.meta.url)), '--stdio'], {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  t.after(() => child.kill());
  let buffer = Buffer.alloc(0);
  let nextId = 1;
  const messages = [];
  const send = payload => {
    const body = JSON.stringify({ jsonrpc: '2.0', ...payload });
    child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
  };
  child.stdout.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    for (;;) {
      const header = buffer.indexOf('\r\n\r\n');
      if (header === -1) return;
      const length = Number(
        buffer
          .subarray(0, header)
          .toString()
          .match(/Content-Length: (\d+)/i)?.[1]
      );
      if (buffer.length < header + 4 + length) return;
      const message = JSON.parse(buffer.subarray(header + 4, header + 4 + length).toString());
      buffer = buffer.subarray(header + 4 + length);
      if (message.method === 'workspace/configuration') send({ id: message.id, result: [{}] });
      else messages.push(message);
    }
  });
  const wait = async predicate => {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const index = messages.findIndex(predicate);
      if (index !== -1) return messages.splice(index, 1)[0];
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.fail(`Timed out waiting for server: ${JSON.stringify(messages)}`);
  };
  const request = async (method, params) => {
    const id = nextId++;
    send({ id, method, params });
    const message = await wait(message => message.id === id);
    assert.equal(message.error, undefined);
    return message.result;
  };
  const initialize = async () => {
    await request('initialize', {
      processId: process.pid,
      capabilities: {},
      workspaceFolders: [{ uri: pathToFileURL(cwd).href, name: 'lifecycle' }],
    });
    send({ method: 'initialized', params: {} });
    await wait(message => message.method === NOTIFICATION_MODULE_GRAPH_BUILT);
  };
  return { child, send, wait, request, initialize };
};

test('JSON and manifest edits update one session and executable plugin imports stop it without exiting the server', async t => {
  const cwd = realpathSync(mkdtempSync(path.join(tmpdir(), 'knip-ls-configuration-')));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const write = (name, source) => writeFileSync(path.join(cwd, name), source);
  write('package.json', '{"name":"configuration","type":"module","devDependencies":{"vite":"*"}}');
  write('knip.json', '{"entry":["index.js"],"project":["*.js"]}');
  write('settings.js', "export const include = ['index.js'];");
  write('vite.config.js', "import { include } from './settings.js'; export default { test: { include } };");
  write('index.js', 'export {};');
  write('unused.js', 'export {};');
  const server = startServer(cwd, t);
  await server.initialize();
  const pid = server.child.pid;
  const change = file =>
    server.send({
      method: 'workspace/didChangeWatchedFiles',
      params: {
        changes: [{ uri: pathToFileURL(path.join(cwd, file)).href, type: 2 }],
      },
    });
  assert.ok((await server.request(REQUEST_RESULTS)).issues.files['unused.js']);
  write('knip.json', '{"entry":["index.js","unused.js"],"project":["*.js"]}');
  change('knip.json');
  await server.wait(
    message => message.method === 'window/logMessage' && message.params.message.startsWith('Module graph updated')
  );
  assert.deepEqual((await server.request(REQUEST_RESULTS)).issues.files, {});
  write('package.json', '{"name":"configuration","type":"module","devDependencies":{"vite":"*","missing-dep":"*"}}');
  change('package.json');
  await server.wait(
    message => message.method === 'window/logMessage' && message.params.message.startsWith('Module graph updated')
  );
  assert.ok((await server.request(REQUEST_RESULTS)).issues.devDependencies['package.json']['missing-dep']);
  write('settings.js', "export const include = ['unused.js'];");
  change('settings.js');
  await server.wait(
    message => message.method === 'window/logMessage' && message.params.message.includes('new process')
  );
  assert.equal(await server.request(REQUEST_RESULTS), null);
  assert.equal(server.child.pid, pid);
  assert.equal(server.child.exitCode, null);
});
