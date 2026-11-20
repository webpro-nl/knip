import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { arrayify } from '../../util/array.ts';
import { type Input, toModule, toEntryPath } from '../../util/input.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';
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

const getThemes = (theme: TypeDocConfig['theme']) => arrayify(theme).filter(name => name !== 'default');

const resolveConfig: ResolveConfig<TypeDocConfig | { typedocOptions: TypeDocConfig }> = (config, options) => {
  const cfg = 'typedocOptions' in config ? config.typedocOptions : config; // exception for `tsconfig.json`
  // TypeDoc accepts a single string for both options, spreading one yields an input per character
  const plugins = arrayify(cfg?.plugin);
  const themes = getThemes(cfg?.theme);
  const inputs: Input[] = [...plugins, ...themes].map(id => toModule(id));
  for (const file of [cfg?.customCss, cfg?.customJs]) {
    if (file) inputs.push(toEntryPath(join(options.configFileDir, file)));
  }
  return inputs;
};

const args = {
  config: ['options'],
  resolve: ['plugin'],
  string: ['theme'],
  resolveInputs: (parsed: ParsedArgs) => getThemes(parsed.theme).map(id => toModule(id)),
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
