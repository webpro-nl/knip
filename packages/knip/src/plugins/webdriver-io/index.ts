import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { isAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { resolvePackageManifestPath } from '../../util/resolve.ts';
import type { WebdriverIOConfig } from './types.ts';

// https://webdriver.io/docs/configuration
// https://github.com/webdriverio/webdriverio/blob/v10.1.1/packages/wdio-utils/src/initializePlugin.ts#L15-L46

const title = 'WebdriverIO';

const enablers = ['@wdio/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['wdio.conf.{js,cjs,mjs,ts,cts,mts}'];

const getNames = (plugins: unknown[] = []) =>
  plugins.flatMap(plugin => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return typeof name === 'string' && !name.startsWith('file://') && !isAbsolute(name) ? [name] : [];
  });

const toPluginDependency = (name: string, type: string, dir: string) => {
  if (name.startsWith('@')) return toDependency(name);
  const scoped = `@wdio/${name.toLowerCase()}-${type}`;
  const community = `wdio-${name.toLowerCase()}-${type}`;
  const isCommunity = !resolvePackageManifestPath(scoped, dir) && resolvePackageManifestPath(community, dir);
  return toDependency(isCommunity ? community : scoped);
};

const resolveConfig: ResolveConfig<WebdriverIOConfig> = async (config, options) => {
  const cfg = config?.config;
  if (!cfg) return [];

  const toInputs = (plugins: unknown[] | undefined, type: string) =>
    getNames(plugins).map(name => toPluginDependency(name, type, options.configFileDir));

  return [
    ...toInputs([cfg.framework], 'framework'),
    ...toInputs([cfg.runner ?? 'local'], 'runner'),
    ...toInputs(cfg.reporters, 'reporter'),
    ...toInputs(cfg.services, 'service'),
  ];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
