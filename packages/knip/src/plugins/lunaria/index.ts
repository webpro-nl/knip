import { dirname, isAbsolute, join } from 'node:path';
import type { Program } from 'oxc-parser';
import type {
  IsPluginEnabled,
  Plugin,
  ResolveConfig,
  ResolveFromAST,
} from '../../types/config.ts';
import type { ConfigArg } from '../../types/args.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toConfig, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { LunariaConfig } from './types.ts';

const title = 'Lunaria';

const enablers = [/^@lunariajs\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const config: string[] = [
  'lunaria.config.json',
  'astro.config.{js,cjs,mjs,ts,mts}',
];

const resolveConfig: ResolveConfig<LunariaConfig> = async (
  localConfig,
  options
) => {
  if (!localConfig) return [];
  const files = localConfig.files?.map(f => f.location) ?? [];
  const renderer = localConfig.renderer ? [localConfig.renderer] : [];
  const customCss = localConfig.dashboard?.customCss ?? [];
  const favicon = localConfig.dashboard?.favicon?.inline
    ? [localConfig.dashboard.favicon.inline]
    : [];

  const baseDir = dirname(options.configFilePath);

  return [...files, ...renderer, ...customCss, ...favicon].map(id =>
    toProductionEntry(isAbsolute(id) ? id : join(baseDir, id))
  );
};

const resolveFromAST: ResolveFromAST = (program: Program) => {
  const configPaths = collectPropertyValues(program, 'configPath');
  return [...configPaths].map(id => toConfig('lunaria', id));
};

const args = {
  binaries: ['lunaria'],
  config: ['config'] satisfies ConfigArg,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  resolveFromAST,
  args,
};

export default plugin;
