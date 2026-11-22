import scss from '../../compilers/scss.ts';
import type { IsPluginEnabled, Plugin, RegisterCompilers, RegisterVisitors } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { createComponentStyleUrlsVisitor } from '../_component-style-urls/component-style-urls-visitor.ts';
import { createCustomElementVisitor } from '../_custom-elements/custom-element-visitor.ts';
import { entry, resolveFromAST } from './resolveFromAST.ts';

// https://stenciljs.com/docs/config

const title = 'Stencil';

const enablers = ['@stencil/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['stencil.config.{ts,js}'];

const production = ['src/**/*.tsx'];

const isStencilSpecifier = (specifier: string): boolean => specifier === '@stencil/core';

// Activate the SCSS compiler when @stencil/sass is a direct dep, so styleUrl .scss references are tracked
const registerCompilers: RegisterCompilers = ({ hasDependency, registerCompiler }) => {
  if (hasDependency('@stencil/sass'))
    for (const ext of ['.scss', '.sass']) registerCompiler({ extension: ext, compiler: scss.compiler });
};

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createCustomElementVisitor(ctx, isStencilSpecifier, { decoratorName: 'Component' }));

  registerVisitor(createComponentStyleUrlsVisitor(ctx, isStencilSpecifier));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveFromAST,
  registerCompilers,
  registerVisitors,
};

export default plugin;
