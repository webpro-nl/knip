import assert from 'node:assert/strict';
import test from 'node:test';
import plugin from '../../src/plugins/nx/index.ts';
import type { PluginOptions } from '../../src/types/config.ts';
import type { NxProjectConfiguration } from '../../src/plugins/nx/types.ts';

// Regression test for https://github.com/webpro-nl/knip/issues/1637
// When nx:run-commands targets don't specify options.cwd, the Nx plugin
// was passing `cwd: undefined` to getInputsFromScripts, which overrides
// the valid baseOptions.cwd and crashes the bash parser's error handler.

test('Nx plugin passes valid cwd to getInputsFromScripts when target has no options.cwd', async () => {
  const receivedCwds: Array<string | undefined> = [];

  const projectConfig: NxProjectConfiguration = {
    targets: {
      build: {
        executor: 'nx:run-commands',
        options: {
          command: 'tsc --noEmit',
        },
      },
      serve: {
        executor: 'nx:run-commands',
        options: {
          commands: ['echo hello'],
        },
      },
    },
  };

  const workspaceCwd = '/test/workspace';

  const options = {
    cwd: workspaceCwd,
    rootCwd: workspaceCwd,
    configFileName: 'project.json',
    configFilePath: '/test/workspace/apps/my-app/project.json',
    configFileDir: '/test/workspace/apps/my-app',
    manifest: {},
    config: { entry: [], project: [] },
    manifestScriptNames: new Set<string>(),
    rootManifest: undefined,
    isProduction: false,
    enabledPlugins: [],
    getInputsFromScripts: (scripts: string | string[] | Set<string>, opts?: { cwd?: string }) => {
      receivedCwds.push(opts?.cwd);
      return [];
    },
  } as unknown as PluginOptions;

  await plugin.resolveConfig!(projectConfig, options);

  // Every call to getInputsFromScripts should have received a defined cwd
  assert(receivedCwds.length > 0, 'getInputsFromScripts should have been called');
  for (const cwd of receivedCwds) {
    assert.equal(typeof cwd, 'string', `cwd must be a string, got ${typeof cwd}`);
    assert.equal(cwd, workspaceCwd, `cwd should fall back to options.cwd when target has no cwd`);
  }
});

test('Nx plugin resolves explicit cwd relative to workspace root', async () => {
  const receivedCwds: Array<string | undefined> = [];

  const projectConfig: NxProjectConfiguration = {
    targets: {
      'build-from-subdir': {
        executor: 'nx:run-commands',
        options: {
          command: 'tsc -p tsconfig.build.json',
          cwd: 'libs/my-lib',
        },
      },
    },
  };

  const workspaceCwd = '/test/workspace';

  const options = {
    cwd: workspaceCwd,
    rootCwd: workspaceCwd,
    configFileName: 'project.json',
    configFilePath: '/test/workspace/libs/my-lib/project.json',
    configFileDir: '/test/workspace/libs/my-lib',
    manifest: {},
    config: { entry: [], project: [] },
    manifestScriptNames: new Set<string>(),
    rootManifest: undefined,
    isProduction: false,
    enabledPlugins: [],
    getInputsFromScripts: (scripts: string | string[] | Set<string>, opts?: { cwd?: string }) => {
      receivedCwds.push(opts?.cwd);
      return [];
    },
  } as unknown as PluginOptions;

  await plugin.resolveConfig!(projectConfig, options);

  assert(receivedCwds.length > 0, 'getInputsFromScripts should have been called');
  for (const cwd of receivedCwds) {
    assert.equal(cwd, '/test/workspace/libs/my-lib', 'cwd should be workspace root joined with target cwd');
  }
});
