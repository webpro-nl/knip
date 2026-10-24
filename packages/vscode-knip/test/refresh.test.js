import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { NOTIFICATION_MODULE_GRAPH_BUILT } from '@knip/language-server/constants';
import { clients } from './language-client-stub.js';
import { hoverProviders, treeProviders, Uri } from './vscode-stub.js';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'vscode') {
      return { url: new URL('./vscode-stub.js', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === 'vscode-languageclient/node') {
      return { url: new URL('./language-client-stub.js', import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { Extension } = await import('../src/index.js');

test('module graph notifications refresh both views and invalidate dependency hover data without diagnostics', async t => {
  const context = { subscriptions: [] };
  const extension = new Extension(context);
  t.after(async () => {
    await extension.stop();
    for (const subscription of context.subscriptions) subscription.dispose();
  });
  await extension.init();
  const client = clients.at(-1);
  const imports = treeProviders.get('knip.imports');
  const exports = treeProviders.get('knip.exports');
  assert.equal(imports.file, client.file);
  assert.equal(exports.file, client.file);

  const hover = hoverProviders.at(-1);
  const document = {
    uri: Uri.file('/workspace/package.json'),
    getText: () => '{"dependencies":{"chalk":"*"}}',
    offsetAt: () => 20,
  };
  client.dependenciesUsage = { chalk: { imports: [{ filePath: '/workspace/before.js' }] } };
  assert.match((await hover.provideHover(document, {})).contents.value, /before\.js/);
  await hover.provideHover(document, {});
  assert.equal(client.packageRequests, 1);

  client.file = { exports: [{ identifier: 'changed', importLocations: [] }], imports: [] };
  client.dependenciesUsage = { chalk: { imports: [{ filePath: '/workspace/after.js' }] } };
  await client.notifications.get(NOTIFICATION_MODULE_GRAPH_BUILT)?.({ duration: 1 });
  assert.equal(imports.file, client.file);
  assert.equal(exports.file, client.file);
  const content = (await hover.provideHover(document, {})).contents.value;
  assert.match(content, /after\.js/);
  assert.doesNotMatch(content, /before\.js/);
  assert.equal(client.packageRequests, 2);
});
