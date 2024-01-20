import ts from 'typescript';
import type { BoundSourceFile } from '../SourceFile.js';

export const isNotJS = (sourceFile: BoundSourceFile) =>
  sourceFile.scriptKind !== ts.ScriptKind.JS && sourceFile.scriptKind !== ts.ScriptKind.JSX;

export const isJS = (sourceFile: BoundSourceFile) =>
  sourceFile.scriptKind === ts.ScriptKind.JS || sourceFile.scriptKind === ts.ScriptKind.JSX;

export function getJSXImplicitImportBase(sourceFile: BoundSourceFile): string | undefined {
  const jsxImportSourcePragmas = sourceFile.pragmas?.get('jsximportsource');
  const jsxImportSourcePragma = Array.isArray(jsxImportSourcePragmas)
    ? jsxImportSourcePragmas[jsxImportSourcePragmas.length - 1]
    : jsxImportSourcePragmas;
  return jsxImportSourcePragma?.arguments.factory;
}

export function hasImportSpecifier(node: ts.Statement, name: string): boolean {
  return (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier) &&
    node.moduleSpecifier.text === name &&
    !!node.importClause?.namedBindings &&
    ts.isNamedImports(node.importClause.namedBindings) &&
    node.importClause.namedBindings.elements.some(element => element.name.text === '$')
  );
}
