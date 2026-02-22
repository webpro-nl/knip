import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { Entry, TsdownConfig } from './types.ts';

// https://github.com/rolldown/tsdown/blob/main/src/options/index.ts

const title = 'tsdown';

const enablers = ['tsdown'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsdown.config.{ts,mts,cts,js,mjs,cjs,json}', 'package.json'];

const normalizeEntry = (entry: Entry | undefined) : string[] => {
  if (!entry) return [];

  if (typeof entry === "string") {
    return [entry];
  }

  if (Array.isArray(entry)) {
    return entry.flatMap(normalizeEntry);
  }

  return Object.values(entry).flatMap(value =>
    Array.isArray(value) ? value : [value]
  );
}

const resolveConfig: ResolveConfig<TsdownConfig> = async config => {
  if (typeof config === 'function') config = await config({});

  const entryPatterns = [config]
    .flat()
    .flatMap(config => normalizeEntry(config.entry))
    .map(id => toProductionEntry(id, { allowIncludeExports: true }));

  return entryPatterns;
};

const args = {
  config: true,
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
