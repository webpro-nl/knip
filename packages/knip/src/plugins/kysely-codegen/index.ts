import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/RobinBlomberg/kysely-codegen#configuration-file

const title = 'kysely-codegen';

const enablers = ['kysely-codegen'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'package.json',
  '.kysely-codegenrc',
  '.kysely-codegenrc.{json,yaml,yml,js,ts,cjs}',
  '.config/kysely-codegenrc',
  '.config/kysely-codegenrc.{json,yaml,yml,js,ts,cjs}',
  'kysely-codegen.config.{js,ts,cjs}',
];

const args = {
  config: ['config-file'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
};

export default plugin;
