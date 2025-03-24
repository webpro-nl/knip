import ts from 'typescript';
import type { ResolveFromAST } from '../../types/config.js';
import { stripQuotes } from '../../typescript/ast-helpers.js';
import { type Input, toDeferResolveProductionEntry } from '../../util/input.js';

export const getInputsFromHandlers: ResolveFromAST = (
  sourceFile,
  options,
  getSourceFile,
  getReferencedInternalFilePath
) => {
  const entries: Input[] = [];
  const importMap = new Map<string, string>();

  // Unbound sourceFile.imports isn't available, maybe create helper
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const importClause = statement.importClause;
      const importPath = stripQuotes(statement.moduleSpecifier.getText());
      if (importClause?.name) importMap.set(importClause.name.text, importPath);
      if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) importMap.set(element.name.text, importPath);
      }
    }
  }

  // Maybe too broad, returns string value of any `handler` property in file (although misses are likely ignored)
  function addHandlerSpecifiers(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText() === 'handler' && ts.isStringLiteral(node.initializer)) {
      const specifier = stripQuotes(node.initializer.getText());
      entries.push(toDeferResolveProductionEntry(specifier, { containingFilePath: options.configFilePath }));
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
            entries.push(input);
            const stackFile = getSourceFile(resolvedPath);
            if (stackFile) ts.forEachChild(stackFile, addHandlerSpecifiers);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);

  return entries;
};
