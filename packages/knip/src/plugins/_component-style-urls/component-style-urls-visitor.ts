import type { Class, ImportDeclaration } from 'oxc-parser';
import { IMPORT_FLAGS } from '../../constants.ts';
import type { PluginVisitorContext, PluginVisitorObject } from '../../types/config.ts';
import { getPropertyValues } from '../../typescript/ast-helpers.ts';
import { dirname, join } from '../../util/path.ts';

export function createComponentStyleUrlsVisitor(
  ctx: PluginVisitorContext,
  isSpecifier: (specifier: string) => boolean
): PluginVisitorObject {
  const componentNames = new Set<string>();

  return {
    Program() {
      componentNames.clear();
    },
    ImportDeclaration(node: ImportDeclaration) {
      if (!isSpecifier(node.source?.value)) return;
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
      if (componentNames.size === 0) return;
      const dir = dirname(ctx.filePath);
      for (const decorator of node.decorators ?? []) {
        const expr = decorator.expression;
        if (expr?.type !== 'CallExpression') continue;
        if (expr.callee?.type !== 'Identifier' || !componentNames.has(expr.callee.name)) continue;
        const arg = expr.arguments?.[0];
        if (arg?.type !== 'ObjectExpression') continue;
        for (const url of getPropertyValues(arg, 'styleUrl'))
          ctx.addImport(join(dir, url), arg.start, IMPORT_FLAGS.NONE);
        for (const url of getPropertyValues(arg, 'styleUrls'))
          ctx.addImport(join(dir, url), arg.start, IMPORT_FLAGS.NONE);
      }
    },
  };
}
