import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { toConfig, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';

// https://stenciljs.com/docs/config

const title = 'Stencil';

const enablers = ['@stencil/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['stencil.config.{ts,js}'];

const production = ['src/**/*.tsx'];

const resolveFromAST: ResolveFromAST = program => {
  const inputs = [];

  const srcDirs = collectPropertyValues(program, 'srcDir');
  const srcDir = srcDirs.size > 0 ? [...srcDirs][0] : 'src';
  inputs.push(toProductionEntry(`${srcDir}/**/*.tsx`));

  for (const script of collectPropertyValues(program, 'globalScript')) {
    inputs.push(toProductionEntry(script));
  }

  for (const tsconfig of collectPropertyValues(program, 'tsconfig')) {
    inputs.push(toConfig('typescript', tsconfig));
  }

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;
