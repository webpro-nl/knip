import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toConfig, toDependency } from '../../util/input.ts';
import type { Manifest } from '../../util/package-json.ts';
import { isAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { resolvePackageManifestPath } from '../../util/resolve.ts';
import type { WebdriverIOConfig } from './types.ts';

// https://webdriver.io/docs/configuration
// https://github.com/webdriverio/webdriverio/blob/v10.1.1/packages/wdio-utils/src/initializePlugin.ts#L15-L46
// https://github.com/webdriverio/webdriverio/blob/v10.1.1/packages/wdio-cli/src/run.ts#L11-L64

const title = 'WebdriverIO';

const enablers = ['@wdio/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['wdio.conf.{js,cjs,mjs,ts,cts,mts}'];

const getNames = (plugins: unknown[] = []) =>
  plugins.flatMap(plugin => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return typeof name === 'string' && !name.startsWith('file://') && !isAbsolute(name) ? [name] : [];
  });

const toPluginDependency = (name: string, type: string, dir: string, manifest: Manifest) => {
  if (name.startsWith('@')) return toDependency(name);
  const scoped = `@wdio/${name.toLowerCase()}-${type}`;
  const community = `wdio-${name.toLowerCase()}-${type}`;
  if (manifest.allDependencies.has(scoped)) return toDependency(scoped);
  if (manifest.allDependencies.has(community)) return toDependency(community);
  const isCommunity = !resolvePackageManifestPath(scoped, dir) && resolvePackageManifestPath(community, dir);
  return toDependency(isCommunity ? community : scoped);
};

const resolveConfig: ResolveConfig<WebdriverIOConfig> = async (config, options) => {
  const cfg = config?.config;
  if (!cfg) return [];

  const toInputs = (plugins: unknown[] | undefined, type: string) =>
    getNames(plugins).map(name => toPluginDependency(name, type, options.configFileDir, options.manifest));

  return [
    ...toInputs([cfg.framework], 'framework'),
    ...toInputs([cfg.runner ?? 'local'], 'runner'),
    ...toInputs(cfg.reporters, 'reporter'),
    ...toInputs(cfg.services, 'service'),
  ];
};

const commands = new Set(['config', 'install', 'repl', 'session']);

const args: Args = {
  binaries: ['wdio'],
  boolean: ['cpuProf', 'headless', 'heapProf'],
  alias: { cpuProf: ['cpu-prof'], heapProf: ['heap-prof'] },
  resolveInputs: parsed => {
    const [command, path] = parsed._;
    const configPath = command === 'run' ? path : command;
    return configPath && !commands.has(configPath) ? [toConfig('webdriver-io', configPath)] : [];
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
};

export default plugin;
