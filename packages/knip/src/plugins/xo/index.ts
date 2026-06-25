import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getInputs } from '../eslint/helpers.ts';
import type { XOConfig } from './types.ts';

// xo@0: https://github.com/xojs/xo/tree/v0.60.0#config
//   type: deprecated (pre-flat)
//   locations: package.json, .xo-config.{js,cjs,json}, xo.config.{js,cjs}
// xo@1: https://github.com/xojs/xo/releases/tag/v1.0.0
//   type: flat
//   locations: package.json, xo.config.{js,cjs,mjs,ts,cts,mts} (drops .xo-config.*)
// xo@2: https://github.com/xojs/xo/releases/tag/v2.0.0
//   locations: package.json, xo.config.{js,mjs,ts,mts} (drops xo.config.{cjs,cts})
// xo@3: https://github.com/xojs/xo/releases/tag/v3.0.0
//   no change

const title = 'xo';

const enablers = ['xo'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', '.xo-config', '.xo-config.{js,cjs,json}', 'xo.config.{js,cjs,mjs,ts,cts,mts}'];

const entry = ['.xo-config.{js,cjs}', 'xo.config.{js,cjs,mjs,ts,cts,mts}'];

const resolveConfig: ResolveConfig<XOConfig> = async (config, options) => {
  const xoVersion = options.manifest.getMajor('xo') ?? 3;
  const isFlatConfig = xoVersion >= 1;

  const inputs = getInputs(config, options, isFlatConfig);

  return [...inputs];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  config,
  resolveConfig,
};

export default plugin;
