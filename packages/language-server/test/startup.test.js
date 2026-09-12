import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NOTIFICATION_MODULE_GRAPH_BUILT } from '../src/constants.js';

const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url));

const encode = payload => {
  const body = JSON.stringify({ jsonrpc: '2.0', ...payload });
  return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
};

test('falls back to bundled knip when the project has no local knip', async () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'knip-ls-'));
  writeFileSync(path.join(cwd, 'package.json'), '{"name":"standalone","main":"index.js"}');
  writeFileSync(path.join(cwd, 'index.js'), '');

  const server = spawn(process.execPath, [cli, '--stdio'], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
  const logs = [];
  let buffer = '';

  const done = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout. Logs:\n${logs.join('\n')}`)), 30_000);
    server.stdout.on('data', chunk => {
      buffer += chunk;
      for (;;) {
        const match = buffer.match(/Content-Length: (\d+)\r\n\r\n/);
        if (!match || buffer.length < match.index + match[0].length + Number(match[1])) break;
        const start = match.index + match[0].length;
        const msg = JSON.parse(buffer.slice(start, start + Number(match[1])));
        buffer = buffer.slice(start + Number(match[1]));
        if (msg.method === 'window/logMessage') logs.push(msg.params.message);
        if (msg.method === 'workspace/configuration') server.stdin.write(encode({ id: msg.id, result: [{}] }));
        if (msg.method === NOTIFICATION_MODULE_GRAPH_BUILT) {
          clearTimeout(timer);
          resolve();
        }
      }
    });
  });

  server.stdin.write(
    encode({
      id: 1,
      method: 'initialize',
      params: {
        processId: process.pid,
        capabilities: {},
        workspaceFolders: [{ uri: pathToFileURL(cwd).href, name: 'standalone' }],
      },
    })
  );
  server.stdin.write(encode({ method: 'initialized', params: {} }));

  try {
    await done;
  } finally {
    server.kill();
  }

  assert.ok(
    logs.some(log => log.startsWith('Using bundled knip')),
    logs.join('\n')
  );
  assert.ok(!logs.some(log => log.includes('ReferenceError')), logs.join('\n'));
});
