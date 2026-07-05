import { toDependency, toProductionEntry } from '../../util/input.ts';
import { isInternal, join } from '../../util/path.ts';

export const handlerToEntry = (handler: string) => {
  const dot = handler.lastIndexOf('.');
  return toProductionEntry(`${handler.slice(0, dot)}.{js,ts}`);
};

export const pluginToInput = (plugin: string, dir: string) =>
  isInternal(plugin) ? toProductionEntry(join(dir, plugin)) : toDependency(plugin);
