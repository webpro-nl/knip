import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
import type { LintHTMLConfig } from './types.js';

// https://linthtml.vercel.app/

const title = 'LintHTML';

const packageJsonPath = 'linthtmlConfig';

const enablers = ['@linthtml/linthtml'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('linthtml')];

const resolveConfig: ResolveConfig<LintHTMLConfig> = config => {
  const extensions = config.extends ?? [];
  const plugins = config.plugins ?? [];
  return [extensions, plugins].flat().map(toDeferResolve);
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;
