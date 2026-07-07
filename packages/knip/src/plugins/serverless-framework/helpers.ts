import { toDeferResolve, toDeferResolveProductionEntry, toProductionEntry } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';

export const handlerToEntry = (handler: string) => {
  const dot = handler.lastIndexOf('.');
  return toProductionEntry(`${handler.slice(0, dot)}.{js,ts}`);
};

export const pluginToInput = (plugin: string, dir: string) =>
  isInternal(plugin) ? toDeferResolveProductionEntry(plugin, { dir }) : toDeferResolve(plugin, { dir });
