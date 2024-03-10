import { _firstGlob } from '#p/util/glob.js';
import { getValuesByKeyDeep } from '#p/util/object.js';
import { join } from '#p/util/path.js';
import { getDependenciesFromScripts } from '#p/util/plugin.js';
import type { IsPluginEnabled, ResolveConfig } from '#p/types/plugins.js';

// https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

const title = 'GitHub Actions';

const enablers = 'This plugin is enabled when a `.yml` or `.yaml` file is found in the `.github/workflows` folder.';

const isEnabled: IsPluginEnabled = async ({ cwd }) =>
  Boolean(await _firstGlob({ cwd, patterns: ['.github/workflows/*.{yml,yaml}'] }));

const config = ['.github/workflows/*.{yml,yaml}', '.github/**/action.{yml,yaml}'];

const isString = (value: unknown): value is string => typeof value === 'string';

const resolveConfig: ResolveConfig = async (config, options) => {
  const { configFileDir, configFileName } = options;

  const scripts = getValuesByKeyDeep(config, 'run').filter(isString);

  const getActionDependencies = () => {
    const isActionManifest = configFileName === 'action.yml' || configFileName === 'action.yaml';
    if (!isActionManifest || !config?.runs?.using?.startsWith('node')) return [];
    const scripts = [config.runs.pre, config.runs.main, config.runs.post].filter(isString);
    return scripts.map(script => join(configFileDir, script));
  };

  return [...getActionDependencies(), ...getDependenciesFromScripts(scripts, { ...options, knownGlobalsOnly: true })];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};
