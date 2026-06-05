import type { IsPluginEnabled, Plugin, RegisterVisitors, ResolveFromAST } from '../../types/config.ts';
import { type Input, toConfig, toEntry, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { createCustomElementVisitor } from '../_custom-elements/custom-element-visitor.ts';

// https://stenciljs.com/docs/config

const title = 'Stencil';

const enablers = ['@stencil/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['stencil.config.{ts,js}'];

const production = ['src/**/*.tsx'];

const entry = ['**/*.spec.{ts,tsx}', '**/*.e2e.{ts,tsx}'];

const isStencilSpecifier = (specifier: string): boolean => specifier === '@stencil/core';

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createCustomElementVisitor(ctx, isStencilSpecifier, undefined, 'Component'));
};

const resolveFromAST: ResolveFromAST = program => {
  const inputs: Input[] = [];

  const srcDirs = collectPropertyValues(program, 'srcDir');
  const srcDir = srcDirs.size > 0 ? [...srcDirs][0] : 'src';
  inputs.push(toProductionEntry(`${srcDir}/**/*.tsx`));

  for (const pattern of entry) inputs.push(toEntry(pattern));

  for (const script of collectPropertyValues(program, 'globalScript')) {
    inputs.push(toProductionEntry(script));
  }

  for (const tsconfig of collectPropertyValues(program, 'tsconfig')) {
    inputs.push(toConfig('typescript', tsconfig));
  }

  for (const setup of collectPropertyValues(program, 'setupFilesAfterEnv')) {
    inputs.push(toEntry(setup));
  }

  for (const setup of collectPropertyValues(program, 'setupFiles')) {
    inputs.push(toEntry(setup));
  }

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveFromAST,
  registerVisitors,
};

export default plugin;
