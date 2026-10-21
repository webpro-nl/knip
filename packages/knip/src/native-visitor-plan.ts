import type { NativeVisitorId } from './native-analyzer.ts';
import { Plugins } from './plugins.ts';
import type { PluginName } from './types/PluginNames.ts';

export const getNativeVisitorPlan = (registeredPlugins: Iterable<PluginName>): NativeVisitorId[] => {
  const plan: NativeVisitorId[] = ['bun-shell'];
  for (const plugin of registeredPlugins) {
    const ids = Plugins[plugin]?.nativeVisitors;
    if (!ids) throw new Error(`Native visitors are not implemented for plugin: ${plugin}`);
    for (const id of ids) plan.push(id);
  }
  return plan;
};
