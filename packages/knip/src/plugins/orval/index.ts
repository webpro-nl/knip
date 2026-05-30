import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getInputsFromAST } from './resolveFromAST.ts';

// https://orval.dev

const title = 'orval';

const enablers = ['orval'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['orval.config.{js,mjs,ts,mts}'];

const resolveFromAST: ResolveFromAST = program => [...getInputsFromAST(program)].map(id => toEntry(id));

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
