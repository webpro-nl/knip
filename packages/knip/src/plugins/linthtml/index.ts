import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toCosmiconfig } from '../../util/plugin-config.ts';
import type { LintHTMLConfig } from './types.ts';

// https://linthtml.vercel.app/

const title = 'LintHTML';

const packageJsonPath = 'linthtmlConfig';

const enablers = ['@linthtml/linthtml'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('linthtml')];

const resolveConfig: ResolveConfig<LintHTMLConfig> = config => {
  const extensions = config.extends ?? [];
  const plugins = config.plugins ?? [];
  return [extensions, plugins].flat().map(id => toDeferResolve(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
};

export default plugin;
