import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDeferResolve, toEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { TypeDocConfig } from './types.ts';

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

const resolveConfig: ResolveConfig<TypeDocConfig | { typedocOptions: TypeDocConfig }> = (config, options) => {
  const cfg = 'typedocOptions' in config ? config.typedocOptions : config; // exception for `tsconfig.json`
  const plugins = cfg?.plugin ?? [];
  const themes = cfg?.theme ?? [];
  const inputs: Input[] = [...plugins, ...themes].map(id => toDeferResolve(id));
  for (const file of [cfg?.customCss, cfg?.customJs]) {
    if (file) inputs.push(toEntry(join(options.configFileDir, file)));
  }
  return inputs;
};

const args = {
  resolve: ['plugin', 'theme'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
  args,
};

export default plugin;
