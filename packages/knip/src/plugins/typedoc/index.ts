import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { TypeDocConfig } from './types.js';

// https://typedoc.org/guides/overview/
// https://github.com/TypeStrong/typedoc/blob/9f0fb048399c7a1273dc452d01cca92b34f4675b/src/lib/utils/options/readers/typedoc.ts#L168

const title = 'TypeDoc';

const enablers = ['typedoc'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'typedocOptions';

const config = [
  'typedoc.{js,cjs,mjs,json,jsonc}',
  'typedoc.config.{js,cjs,mjs}',
  '.config/typedoc.{js,cjs,mjs,json,jsonc}',
  '.config/typedoc.config.{js,cjs,mjs}',
  'package.json',
  'tsconfig.json',
];

const resolveConfig: ResolveConfig<TypeDocConfig | { typedocOptions: TypeDocConfig }> = config => {
  const cfg = 'typedocOptions' in config ? config.typedocOptions : config; // exception for `tsconfig.json`
  const plugins = cfg?.plugin ?? [];
  const themes = cfg?.theme ?? [];
  return [...plugins, ...themes].map(toDeferResolve);
};

const args = {
  resolve: ['plugin', 'theme'],
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
  args,
} satisfies Plugin;
