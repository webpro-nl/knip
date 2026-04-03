import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getInputFromAST } from './resolveFromAST.ts';

// https://rolldown.rs

const title = 'Rolldown';

const enablers = ['rolldown'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rolldown.config.{js,cjs,mjs,ts,cts,mts}'];

const resolveFromAST: ResolveFromAST = program => {
  const inputs = getInputFromAST(program);
  return [...inputs].map(id => toProductionEntry(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
