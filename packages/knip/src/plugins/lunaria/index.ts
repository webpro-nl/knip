import type {
  IsPluginEnabled,
  Plugin,
  ResolveConfig,
} from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { LunariaConfig } from './types.ts';

// https://lunaria.dev/reference/configuration/

const title = 'Lunaria';

const enablers = [/^@lunariajs\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const config: string[] = ['lunaria.config.json'];

const production: string[] = ['lunaria.config.json'];

const resolveConfig: ResolveConfig<LunariaConfig> = async localConfig => {
  const files = localConfig.files?.map(f => f.location) ?? [];
  const renderer = localConfig.renderer ? [localConfig.renderer] : [];
  const customCss = localConfig.dashboard?.customCss ?? [];
  const favicon = localConfig.dashboard?.favicon?.inline
    ? [localConfig.dashboard.favicon.inline]
    : [];

  return [...files, ...renderer, ...customCss, ...favicon].map(id =>
    toProductionEntry(id)
  );
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
};

export default plugin;
