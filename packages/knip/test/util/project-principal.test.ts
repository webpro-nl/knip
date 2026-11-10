import assert from 'node:assert/strict';
import test from 'node:test';
import { ProjectPrincipal } from '../../src/ProjectPrincipal.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Analysis errors fail the walk instead of silently skipping the file', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/compilers/basic') });
  const principal = new ProjectPrincipal(
    options,
    filePath => filePath,
    undefined,
    () => undefined
  );
  principal.fileManager.loadSourceText = () => 'export const apple = 1;';
  principal.init();
  principal.addEntryPath('/project/index.ts');

  await assert.rejects(
    principal.walkAndAnalyze(
      () => {
        throw new Error('analysis failed');
      },
      () => undefined
    ),
    { message: 'analysis failed' }
  );
});
