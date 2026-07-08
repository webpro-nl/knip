import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://esbuild.github.io/api/#entry-points

const title = 'esbuild';

const enablers = ['esbuild'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['esbuild.config.{js,mjs,cjs,ts,mts,cts}', 'esbuild.{js,mjs,cjs,ts,mts,cts}'];

const resolveFromAST: ResolveFromAST = (program, { configFileDir }) =>
  [...collectPropertyValues(program, 'entryPoints')].map(id => toProductionEntry(join(configFileDir, id)));

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
