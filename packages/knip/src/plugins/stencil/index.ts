import { Visitor, type Class, type ImportDeclaration, type ObjectExpression } from 'oxc-parser';
import scss from '../../compilers/scss.ts';
import { IMPORT_FLAGS } from '../../constants.ts';
import { type Input, toConfig, toEntry, toProductionEntry } from '../../util/input.ts';
import { dirname, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { collectPropertyValues, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { createCustomElementVisitor } from '../_custom-elements/custom-element-visitor.ts';
import type {
  IsPluginEnabled,
  Plugin,
  RegisterCompilers,
  RegisterVisitors,
  ResolveFromAST,
} from '../../types/config.ts';

// https://stenciljs.com/docs/config

const title = 'Stencil';

const enablers = ['@stencil/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['stencil.config.{ts,js}'];

const production = ['src/**/*.tsx'];

const entry = ['**/*.spec.{ts,tsx}', '**/*.e2e.{ts,tsx}'];

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

const resolveFromAST: ResolveFromAST = program => {
  const inputs: Input[] = [];

  const srcDirs = collectPropertyValues(program, 'srcDir');
  const srcDir = srcDirs.size > 0 ? [...srcDirs][0] : 'src';
  inputs.push(toProductionEntry(`${srcDir}/**/*.tsx`));

  for (const pattern of entry) inputs.push(toEntry(pattern));

  for (const script of collectPropertyValues(program, 'globalScript')) {
    inputs.push(toProductionEntry(script));
  }

  for (const style of collectPropertyValues(program, 'globalStyle')) {
    inputs.push(toProductionEntry(style));
  }

  // v5: outputTargets: [{ type: 'global-style', input: 'src/global.scss' }]
  new Visitor({
    ObjectExpression(node: ObjectExpression) {
      const typeValues = getPropertyValues(node, 'type');
      if (!typeValues.has('global-style')) return;
      for (const input of getPropertyValues(node, 'input')) inputs.push(toProductionEntry(input));
    },
  }).visit(program);

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
  registerCompilers,
  registerVisitors,
};

export default plugin;
