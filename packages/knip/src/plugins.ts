import { Plugins } from './plugins/index.js';
import type { PluginName } from './types/PluginNames.js';
import type { Args } from './types/args.js';
import type { Entries, PluginMap } from './types/config.js';
import { timerify } from './util/Performance.js';
import parsedArgValues from './util/cli-arguments.js';

const PMap: PluginMap = Plugins;

const { performance: isEnabled = false } = parsedArgValues;

const timerifyMethods = ['resolve', 'resolveConfig', 'resolveEntryPaths'] as const;

const PluginEntries = Object.entries(PMap) as Entries;

if (isEnabled) {
  for (const [, plugin] of PluginEntries) {
    for (const method of timerifyMethods) {
      // @ts-expect-error function signatures don't match but doesn't matter
      if (method in plugin) plugin[method] = timerify(plugin[method], `${method} (${plugin.title})`);
    }
  }
}

const pluginArgsMap = new Map(
  PluginEntries.flatMap(([pluginName, plugin]) => {
    if (!plugin.args) return [];
    const item: [PluginName, Args] = [pluginName, plugin.args];
    if (Array.isArray(plugin.args?.binaries)) return plugin.args.binaries.map(bin => [bin, item]);
    return [[pluginName, item]];
  })
);

export { PMap as Plugins, PluginEntries, pluginArgsMap };
