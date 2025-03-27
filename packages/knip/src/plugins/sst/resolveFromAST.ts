import ts from 'typescript';
import type { ResolveFromAST } from '../../types/config.js';
import { getImportMap, getPropertyValues } from '../../typescript/ast-helpers.js';
import { toDeferResolveProductionEntry } from '../../util/input.js';

export const getInputsFromHandlers: ResolveFromAST = (sourceFile, options) => {
  const { getSourceFile, getReferencedInternalFilePath } = options;
  const entries = new Set<string>();
  const importMap = getImportMap(sourceFile);

  // Maybe too broad, returns string value of any `handler` property in file (although misses are likely ignored)
  function addHandlerSpecifiers(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      const specifiers = getPropertyValues(node, 'handler');
      for (const specifier of specifiers) entries.add(specifier);
    }
    ts.forEachChild(node, addHandlerSpecifiers);
  }

  ts.forEachChild(sourceFile, addHandlerSpecifiers); // Only for v3?

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'stack'
    ) {
      const arg = node.arguments[0];
      if (ts.isIdentifier(arg)) {
        const importPath = importMap.get(arg.text);
        if (importPath) {
          const input = toDeferResolveProductionEntry(importPath, { containingFilePath: options.configFilePath });
          const resolvedPath = getReferencedInternalFilePath(input); // Resolve here as well so we can `getSourceFile`
          if (resolvedPath) {
            const stackFile = getSourceFile(resolvedPath);
            if (stackFile) ts.forEachChild(stackFile, addHandlerSpecifiers);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);

  return Array.from(entries).map(specifier =>
    toDeferResolveProductionEntry(specifier, { containingFilePath: options.configFilePath })
  );
};
