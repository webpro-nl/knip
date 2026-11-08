import { type PluginName, pluginNames } from '../types/PluginNames.ts';

const names = new Set<string>(pluginNames);

export const isPluginName = (name: string): name is PluginName => names.has(name);
