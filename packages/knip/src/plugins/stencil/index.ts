import type { Class, ImportDeclaration } from 'oxc-parser';
import scss from '../../compilers/scss.ts';
import { IMPORT_FLAGS } from '../../constants.ts';
import type { IsPluginEnabled, Plugin, RegisterCompilers, RegisterVisitors } from '../../types/config.ts';
import { getPropertyValues } from '../../typescript/ast-helpers.ts';
import { dirname, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
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

  // Resolve styleUrl / styleUrls from @Component decorator args so knip doesn't flag referenced SCSS files
  const componentNames = new Set<string>();

  registerVisitor({
    Program() {
      componentNames.clear();
    },
    ImportDeclaration(node: ImportDeclaration) {
      if (!isStencilSpecifier(node.source?.value)) return;
      for (const spec of node.specifiers ?? []) {
        if (
          spec.type === 'ImportSpecifier' &&
          spec.imported.type === 'Identifier' &&
          spec.imported.name === 'Component'
        )
          componentNames.add(spec.local.name);
      }
    },
    ClassDeclaration(node: Class) {
      resolveStyleUrls(node);
    },
  });

  function resolveStyleUrls(node: Class) {
    const dir = dirname(ctx.filePath);
    for (const decorator of node.decorators ?? []) {
      const expr = decorator.expression;
      if (expr?.type !== 'CallExpression') continue;
      if (expr.callee?.type !== 'Identifier' || !componentNames.has(expr.callee.name)) continue;
      const arg = expr.arguments?.[0];
      if (arg?.type !== 'ObjectExpression') continue;
      for (const url of getPropertyValues(arg, 'styleUrl')) ctx.addImport(join(dir, url), arg.start, IMPORT_FLAGS.NONE);
      for (const url of getPropertyValues(arg, 'styleUrls'))
        ctx.addImport(join(dir, url), arg.start, IMPORT_FLAGS.NONE);
    }
  }
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
