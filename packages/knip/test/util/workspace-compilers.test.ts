import assert from 'node:assert/strict';
import test from 'node:test';
import { ProjectPrincipal } from '../../src/ProjectPrincipal.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Select synchronous and asynchronous compilers by the owning workspace', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/compilers/basic') });
  const owners = new Map([
    ['/project/client/view.template', 'client'],
    ['/project/server/view.template', 'server'],
  ]);
  const principal = new ProjectPrincipal(
    options,
    filePath => filePath,
    undefined,
    filePath => owners.get(filePath)
  );
  principal.fileManager.readRawFile = () => 'raw';
  principal.addCompilers('client', new Map([['.template', () => 'client']]));
  principal.addCompilers('server', new Map([['.template', () => Promise.resolve('server')]]));

  principal.addEntryPath('/project/server/view.template');
  assert.equal(principal.entryPaths.has('/project/server/view.template'), true);
  assert.equal(principal.fileManager.loadSourceText('/project/client/view.template'), 'client');
  assert.equal(await principal.fileManager.loadSourceText('/project/server/view.template'), 'server');
  assert.equal(principal.fileManager.loadSourceText('/project/other/view.template'), 'client');

  principal.addCompilers('client', new Map([['.template', () => 'updated']]));
  principal.invalidateFile('/project/client/view.template');
  assert.equal(principal.fileManager.loadSourceText('/project/client/view.template'), 'updated');
});
