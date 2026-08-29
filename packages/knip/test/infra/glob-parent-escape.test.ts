import assert from 'node:assert/strict';
import test from 'node:test';
import { getGitIgnoredHandler, glob } from '../../src/util/glob-core.ts';
import { join, relative } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/glob-parent-escape/workspace');

test('Preserve the crawl root for patterns escaping the workspace', async () => {
  await getGitIgnoredHandler({ cwd, gitignore: true });

  const options = {
    cwd,
    dir: cwd,
    gitignore: true,
    absolute: true,
    dot: true,
    label: 'test paths',
  };

  const paths = await glob(['../shared/*.ts', 'ignored/*.ts'], options);

  assert.deepEqual(
    paths.map(filePath => relative(cwd, filePath)),
    ['../shared/helper.ts']
  );

  const reenteringPaths = await glob(['../workspace/ignored/*.ts', '*.ts'], options);

  assert.deepEqual(reenteringPaths, []);

  const normalizedPaths = await glob(['../shared/*.ts', join(cwd, 'ignored/*.ts'), 'ignored/*.js'], options);

  assert.deepEqual(
    normalizedPaths.map(filePath => relative(cwd, filePath)),
    ['../shared/helper.ts']
  );

  const absolutePattern = join(cwd, '../shared/*.ts');
  const absolutePaths = await glob(['../shared/*.ts', absolutePattern, 'src/*.ts', 'ignored/*.ts'], options);

  assert.deepEqual(absolutePaths.map(filePath => relative(cwd, filePath)).sort(), [
    '../shared/helper.ts',
    'src/entry.ts',
  ]);

  const unnormalizedPaths = await glob(['../shared/*.ts', `${cwd}/src/../ignored/*.ts`, 'ignored/*.js'], options);

  assert.deepEqual(
    unnormalizedPaths.map(filePath => relative(cwd, filePath)),
    ['../shared/helper.ts']
  );

  const unnormalizedEscaping = await glob(['../shared/*.ts', `${cwd}/src/../../shared/*.ts`, 'ignored/*.js'], options);

  assert.deepEqual(
    unnormalizedEscaping.map(filePath => relative(cwd, filePath)),
    ['../shared/helper.ts']
  );

  const extglobPaths = await glob(['../nonexistent/*.ts', '@(..|src)/shared/*.ts', 'ignored/*.js'], options);

  assert.deepEqual(
    extglobPaths.map(filePath => relative(cwd, filePath)),
    ['../shared/helper.ts']
  );

  const negatedPaths = await glob(
    ['../shared/*.ts', '@(..|src)/shared/*.ts', '!../shared/nope.ts', 'ignored/*.js'],
    options
  );

  assert.deepEqual(
    negatedPaths.map(filePath => relative(cwd, filePath)),
    ['../shared/helper.ts']
  );
});
