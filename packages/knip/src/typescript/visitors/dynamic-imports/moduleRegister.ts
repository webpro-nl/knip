import ts from 'typescript';
import { IMPORT_FLAGS } from '../../../constants.ts';
import { isPropertyAccessCall } from '../../ast-helpers.ts';
import { importVisitor as visit } from '../index.ts';

const isNodeModuleImport = (node: ts.Statement) =>
  ts.isImportDeclaration(node) &&
  ts.isStringLiteral(node.moduleSpecifier) &&
  (node.moduleSpecifier.text === 'node:module' || node.moduleSpecifier.text === 'module');

export default visit(
  sourceFile => sourceFile.statements.some(isNodeModuleImport),
  node => {
    if (
      (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'register') ||
      isPropertyAccessCall(node, 'module.register')
    ) {
      // Pattern: register('@nodejs-loaders/tsx', import.meta.url)
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;
        const arg1 = node.arguments[1];
        if (
          specifier &&
          (!specifier.startsWith('.') ||
            (arg1 &&
              ts.isPropertyAccessExpression(arg1) &&
              ts.isMetaProperty(arg1.expression) &&
              arg1.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
              arg1.name.text === 'url'))
        )
          return {
            specifier,
            identifier: undefined,
            pos: node.arguments[0].pos,
            modifiers: IMPORT_FLAGS.ENTRY,
            alias: undefined,
            namespace: undefined,
            symbol: undefined,
          };
      }
    }
  }
);
