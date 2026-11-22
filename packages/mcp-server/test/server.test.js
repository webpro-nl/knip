import assert from 'node:assert/strict';
import { relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createOptions, createSession, version } from 'knip/session';
import { mcpServer } from '../src/server.js';
import { buildResults } from '../src/tools.js';

const cwd = fileURLToPath(new URL('./fixtures/server', import.meta.url));

const client = new Client({ name: 'test', version: '0.0.0' });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await mcpServer.connect(serverTransport);
await client.connect(clientTransport);

test.after(async () => {
  await client.close();
});

/** @param {any} result */
const getText = result => result.content[0].text;

/** @param {Record<string, unknown>} args */
const runKnip = async args => {
  const result = await client.callTool({ name: 'knip-run', arguments: args });
  assert.notEqual(result.isError, true, getText(result));
  return result;
};

test('sends short server instructions', () => {
  const instructions = client.getInstructions() ?? '';
  assert.match(instructions, /call knip-run first, read the topics it lists in docs with knip-docs/);
  assert.ok(instructions.length < 500, `${instructions.length} chars`);
});

test('knip-run reports the version that ran and the version installed in the project', async () => {
  const output = JSON.parse(getText(await runKnip({ cwd })));
  assert.equal(output.knipVersion, version);
  assert.equal(output.projectKnipVersion, '0.0.1');
  assert.match(output.versionHint, new RegExp(`Knip ${version}.+knip 0\\.0\\.1`));
});

test('buildResults accepts a relative cwd', async () => {
  // The VS Code extension passes the cwd it gets as-is when it reuses language server results
  const options = await createOptions({ cwd, isSession: true, isUseTscFiles: false });
  const session = await createSession(options);
  const output = buildResults(session.getResults(), {
    cwd: relative(process.cwd(), cwd),
    configFilePath: options.configFilePath,
  });
  assert.equal(output.projectKnipVersion, '0.0.1');
});

test('knip-run lists doc sections for its findings', async () => {
  const output = JSON.parse(getText(await runKnip({ cwd })));
  assert.deepEqual(output.files, ['unused.js']);
  assert.ok(output.docs.includes('handling-issues#unused-files'));
  assert.ok(output.docs.includes('handling-issues#unused-dependencies'));
  assert.ok(output.docs.includes('configuration-hints'));
});

test('knip-docs returns a section', async () => {
  const result = await client.callTool({ name: 'knip-docs', arguments: { topic: 'handling-issues#unused-files' } });
  assert.notEqual(result.isError, true);
  assert.match(getText(result), /^## Unused files\n/);
});

test('knip-run declares an output schema', async () => {
  const { tools } = await client.listTools();
  const tool = tools.find(tool => tool.name === 'knip-run');
  assert.equal(tool?.outputSchema?.type, 'object');
  assert.ok(tool?.outputSchema?.properties?.docs);
});

test('knip-run returns structured content', async () => {
  const result = await runKnip({ cwd });
  const output = /** @type {any} */ (result.structuredContent);
  assert.deepEqual(JSON.parse(getText(result)), JSON.parse(JSON.stringify(output)));
  const hint = output.configurationHints.find(hint => hint.type === 'ignoreBinaries');
  assert.equal(hint?.identifier, 'pm2-.+');
});

test('reads a doc page as resource by path', async () => {
  const { contents } = await client.readResource({ uri: 'knip://docs/reference/cli' });
  assert.equal(contents[0].mimeType, 'text/markdown');
  assert.match(String(contents[0].text), /--production/);
});
