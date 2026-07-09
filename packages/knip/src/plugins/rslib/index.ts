import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://rslib.rs/guide/basic/configure-rslib

const title = 'Rslib';

const enablers = ['@rslib/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rslib*.config.{mjs,ts,js,cjs,mts,cts}'];

const resolveFromAST: ResolveFromAST = program =>
  [...collectPropertyValues(program, 'entry')].map(id => toProductionEntry(id, { allowIncludeExports: true }));

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
