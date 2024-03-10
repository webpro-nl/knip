import { hasDependency } from '#p/util/plugin.js';
import type { IsPluginEnabled, ResolveConfig } from '#p/types/plugins.js';
import type { TypeDocConfig } from './types.js';

// https://typedoc.org/guides/overview/

const title = 'TypeDoc';

const enablers = ['typedoc'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'typedocOptions';

const config = [
  'typedoc.{js,cjs,json,jsonc}',
  'typedoc.config.{js,cjs}',
  '.config/typedoc.{js,cjs,json,jsonc}',
  '.config/typedoc.config.{js,cjs}',
  'package.json',
  'tsconfig.json',
];

const resolveConfig: ResolveConfig<TypeDocConfig | { typedocOptions: TypeDocConfig }> = config => {
  config = 'typedocOptions' in config ? config.typedocOptions : config; // exception for `tsconfig.json`
  return config?.plugin ?? [];
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} as const;
