import type {
  IsLoadConfig,
  IsPluginEnabled,
  Plugin,
  PluginOptions,
  ResolveConfig,
  ResolveFromAST,
} from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getInputs } from '../eslint/helpers.ts';
import { getInputsFromFlatConfigAST } from '../eslint/resolveFromAST.ts';
import type { XOConfig } from './types.ts';

// xo@0:  deprecated (eslintrc) config — package.json, .xo-config.{js,cjs,json}, xo.config.{js,cjs}
// xo@1+: ESLint flat config — package.json, xo.config.{js,cjs,mjs,ts,cts,mts} (v2+ drops cjs/cts)
// https://github.com/xojs/xo/releases

const title = 'xo';

const enablers = ['xo'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', '.xo-config', '.xo-config.{js,cjs,json}', 'xo.config.{js,cjs,mjs,ts,cts,mts}'];

const entry = ['.xo-config.{js,cjs}', 'xo.config.{js,cjs,mjs,ts,cts,mts}'];

const isFlatConfig = ({ manifest }: PluginOptions) => (manifest.getMajor('xo') ?? 1) >= 1;

const isLoadConfig: IsLoadConfig = options => !isFlatConfig(options);

const resolveConfig: ResolveConfig<XOConfig> = (config, options) => getInputs(config, options);

const resolveFromAST: ResolveFromAST = (program, options) =>
  isFlatConfig(options) ? getInputsFromFlatConfigAST(program) : [];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  config,
  isLoadConfig,
  resolveConfig,
  resolveFromAST,
};

export default plugin;
