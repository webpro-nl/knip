import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { _glob } from '#p/util/glob.js';
import { getDependenciesFromScripts } from '../../util/plugin.js';

// https://docs.travis-ci.com/user/customizing-the-build/

const title = 'Travis CI';

const enablers = 'This plugin is enabled when a `.travis.yml` file is found in the root folder.';

const isEnabled: IsPluginEnabled = async ({ cwd }) => Boolean(await _glob({ cwd, patterns: ['.travis.yml'] }));

const config = ['.travis.yml'];

const resolveConfig: ResolveConfig = async (config, options) => {
  if (!config) return [];

  const beforeDeploy = [config.before_deploy ?? []].flat();
  const beforeInstall = [config.before_install ?? []].flat();
  const beforeScript = [config.before_script ?? []].flat();

  const scripts = [...beforeDeploy, ...beforeInstall, ...beforeScript];

  return getDependenciesFromScripts(scripts, { ...options, knownGlobalsOnly: true });
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
