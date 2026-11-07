import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import type { Manifest } from '../../util/package-json.ts';
import { isAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
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

const getDeclaredDependencies = (manifests: (Manifest | undefined)[]) =>
  new Set(
    manifests.flatMap(manifest => [
      ...Object.keys(manifest?.dependencies ?? {}),
      ...Object.keys(manifest?.devDependencies ?? {}),
      ...Object.keys(manifest?.optionalDependencies ?? {}),
      ...Object.keys(manifest?.peerDependencies ?? {}),
    ])
  );

const toPluginDependency = (name: string, type: string, dependencies: Set<string>) => {
  if (name.startsWith('@')) return toDependency(name);
  const scoped = `@wdio/${name.toLowerCase()}-${type}`;
  const community = `wdio-${name.toLowerCase()}-${type}`;
  return toDependency(!dependencies.has(scoped) && dependencies.has(community) ? community : scoped);
};

const resolveConfig: ResolveConfig<WebdriverIOConfig> = async (config, options) => {
  const cfg = config?.config;
  if (!cfg) return [];

  const declared = getDeclaredDependencies([options.manifest, options.rootManifest]);
  const toInputs = (plugins: unknown[] | undefined, type: string) =>
    getNames(plugins).map(name => toPluginDependency(name, type, declared));

  return [
    ...toInputs([cfg.framework], 'framework'),
    ...toInputs([cfg.runner], 'runner'),
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
