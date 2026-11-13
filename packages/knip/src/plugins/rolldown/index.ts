import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://rolldown.rs

const title = 'Rolldown';

const enablers = ['rolldown'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rolldown.config.{js,cjs,mjs,ts,cts,mts}'];

const resolveFromAST: ResolveFromAST = program =>
  Array.from(collectPropertyValues(program, 'input'), id => toEntry(id, { production: true }));

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
