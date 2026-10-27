import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/RobinBlomberg/kysely-codegen#configuration-file
// https://github.com/RobinBlomberg/kysely-codegen/blob/0.20.0/src/config/config.ts
// https://github.com/cosmiconfig/cosmiconfig/blob/v9.0.0/src/defaults.ts

const title = 'kysely-codegen';

const enablers = ['kysely-codegen'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = [
  '.kysely-codegenrc.{js,ts,cjs}',
  '.config/kysely-codegenrc.{js,ts,cjs}',
  'kysely-codegen.config.{js,ts,cjs}',
];

const args = {
  config: ['config-file'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  args,
};

export default plugin;
