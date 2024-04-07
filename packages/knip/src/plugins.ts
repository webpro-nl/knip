import type { Entries } from 'type-fest';
import * as originalPlugins from './plugins/index.js';
import type { PluginName } from './types/config.js';
import type { Plugin } from './types/plugins.js';
import { timerify } from './util/Performance.js';
import parsedArgValues from './util/cli-arguments.js';

const { performance: isEnabled = false } = parsedArgValues;

const plugins = (isEnabled ? {} : originalPlugins) as Record<PluginName, Plugin>;

const methods = ['resolve', 'resolveConfig', 'resolveEntryPaths'] as const;

if (isEnabled) {
  for (const [name, plugin] of Object.entries(originalPlugins) as Entries<typeof originalPlugins>) {
    plugins[name] = plugin;
    for (const method of methods) {
      if (method in plugin) {
        // @ts-expect-error It's fine, really.
        plugins[name][method] = timerify(plugin[method], `${method} (${plugin.title})`);
      }
    }
  }
}

export { plugins };
