import { _firstGlob } from '../../util/glob.js';
import { getValuesByKeyDeep } from '../../util/object.js';
import { dirname, join } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

export const NAME = 'GitHub Actions';

/** @public */
export const ENABLERS =
  'This plugin is enabled when a `.yml` or `.yaml` file is found in the `.github/workflows` folder.';

export const isEnabled: IsPluginEnabledCallback = async ({ cwd }) =>
  Boolean(await _firstGlob({ cwd, patterns: ['.github/workflows/*.{yml,yaml}'] }));

export const CONFIG_FILE_PATTERNS = ['.github/workflows/*.{yml,yaml}', '.github/**/action.{yml,yaml}'];

const findGithubActionsDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { cwd, manifest, isProduction } = options;

  if (isProduction) return [];

  const config = await load(configFilePath);

  if (!config) return [];

  const scripts = getValuesByKeyDeep(config, 'run').filter(isString);

  return [
    ...getActionDependencies(),
    ...getDependenciesFromScripts(scripts, {
      cwd,
      manifest,
      knownGlobalsOnly: true,
    }),
  ];

  function getActionDependencies() {
    const isActionManifest = configFilePath.endsWith('action.yml') || configFilePath.endsWith('action.yaml');
    if (!isActionManifest || !config?.runs?.using?.startsWith('node')) {
      return [];
    }

    const scripts = [config.runs.pre, config.runs.main, config.runs.post].filter(isString);

    return scripts.map(script => join(dirname(configFilePath), script));
  }
};

export const findDependencies = timerify(findGithubActionsDependencies);
