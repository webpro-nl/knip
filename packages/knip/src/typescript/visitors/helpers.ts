import ts from 'typescript';
import type { BoundSourceFile } from '../SourceFile.js';

export const isNotJS = (sourceFile: BoundSourceFile) => !isJS(sourceFile);

export const isJS = (sourceFile: BoundSourceFile) =>
  sourceFile.scriptKind === ts.ScriptKind.JS || sourceFile.scriptKind === ts.ScriptKind.JSX;

export const isModule = (sourceFile: BoundSourceFile) => ts.isExternalModule(sourceFile);

export function hasImportSpecifier(node: ts.Statement, name: string, id?: string): boolean {
  return (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier) &&
    node.moduleSpecifier.text === name &&
    !!node.importClause?.namedBindings &&
    ts.isNamedImports(node.importClause.namedBindings) &&
    (!id || node.importClause.namedBindings.elements.some(element => element.name.text === id))
  );
}
