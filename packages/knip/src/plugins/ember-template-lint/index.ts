import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toModule } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/ember-template-lint/ember-template-lint/blob/v7.9.4/docs/configuration.md
// https://github.com/ember-template-lint/ember-template-lint/blob/v7.9.4/lib/get-config.js

const title = 'ember-template-lint';

const enablers = ['ember-template-lint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.template-lintrc.{js,cjs,mjs}'];

const resolveFromAST: ResolveFromAST = program =>
  Array.from(collectPropertyValues(program, 'plugins'), id => toModule(id));

const args = {
  config: ['config-path'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
  args,
};

export default plugin;
