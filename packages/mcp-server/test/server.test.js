import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { mcpServer } from '../src/server.js';

const client = new Client({ name: 'test', version: '0.0.0' });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await mcpServer.connect(serverTransport);
await client.connect(clientTransport);

test.after(async () => {
  await client.close();
});

test('sends short server instructions', () => {
  const instructions = client.getInstructions() ?? '';
  assert.match(instructions, /call knip-run first, read the topics it lists in docs with knip-docs/);
  assert.ok(instructions.length < 500, `${instructions.length} chars`);
});
