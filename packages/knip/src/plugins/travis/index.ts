import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { _glob } from '../../util/glob.js';

// https://docs.travis-ci.com/user/customizing-the-build/

const title = 'Travis CI';

const enablers = 'This plugin is enabled when a `.travis.yml` file is found in the root folder.';

const isEnabled: IsPluginEnabled = async ({ cwd }) => (await _glob({ cwd, patterns: ['.travis.yml'] })).length > 0;

const isRootOnly = true;

const config = ['.travis.yml'];

const resolveConfig: ResolveConfig = async (config, options) => {
  if (!config) return [];

  const beforeDeploy = config.before_deploy ?? [];
  const beforeInstall = config.before_install ?? [];
  const beforeScript = config.before_script ?? [];

  const scripts = [beforeDeploy, beforeInstall, beforeScript].flat();

  return options.getInputsFromScripts(scripts, { knownBinsOnly: true });
};

export default {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  config,
  resolveConfig,
} satisfies Plugin;
