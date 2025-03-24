import ts from 'typescript';
import { stripQuotes } from '../../typescript/ast-helpers.js';

export const getComponentPathsFromSourceFile = (sourceFile: ts.SourceFile) => {
  const componentPaths: Set<string> = new Set();
  let starlightImportName: string | undefined;

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const importPath = stripQuotes(node.moduleSpecifier.getText());
      if (importPath === '@astrojs/starlight') starlightImportName = node.importClause?.name?.getText();
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === starlightImportName) {
      const firstArg = node.arguments[0];
      if (ts.isObjectLiteralExpression(firstArg)) {
        const prop = firstArg.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText() === 'components');

        if (prop && ts.isPropertyAssignment(prop)) {
          const componentsObj = prop.initializer;
          if (ts.isObjectLiteralExpression(componentsObj)) {
            for (const prop of componentsObj.properties) {
              if (ts.isPropertyAssignment(prop)) {
                if (ts.isStringLiteral(prop.initializer)) componentPaths.add(stripQuotes(prop.initializer.getText()));
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return componentPaths;
};
