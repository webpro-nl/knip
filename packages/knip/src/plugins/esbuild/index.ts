import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toEntry, toEntryPath } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://esbuild.github.io/api/#entry-points

const title = 'esbuild';

const enablers = ['esbuild'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['esbuild.config.{js,mjs,cjs,ts,mts,cts}', 'esbuild.{js,mjs,cjs,ts,mts,cts}'];

const resolveFromAST: ResolveFromAST = (program, { configFileDir }) =>
  Array.from(collectPropertyValues(program, 'entryPoints'), id =>
    toEntry(join(configFileDir, id), { production: true })
  );

const args: Args = {
  args: args => args.filter(arg => !arg.startsWith('-')),
  resolveInputs: parsed => parsed._.map(id => toEntryPath(id)),
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
