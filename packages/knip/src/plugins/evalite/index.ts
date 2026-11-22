import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { type Input, toModule, toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://www.evalite.dev/guides/configuration
// https://github.com/mattpocock/evalite/blob/evalite@0.19.0/packages/evalite/src/config.ts
// https://github.com/mattpocock/evalite/blob/evalite@0.19.0/packages/evalite/src/run-evalite.ts

const title = 'Evalite';

const enablers = ['evalite'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['evalite.config.{ts,mts,js,mjs}'];

const entry = ['**/*.eval.?(m)ts'];

const resolveFromAST: ResolveFromAST = (program, options) => {
  const inputs: Input[] = [];
  if (!options.config.entry) for (const id of entry) inputs.push(toEntry(id));
  for (const id of collectPropertyValues(program, 'setupFiles')) inputs.push(toModule(id));
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveFromAST,
};

export default plugin;
