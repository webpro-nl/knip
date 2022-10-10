import { ts } from 'ts-morph';
import type { ExportedDeclarations } from 'ts-morph';

export const getType = (declaration: ExportedDeclarations) => {
  if (declaration.isKind(ts.SyntaxKind.TypeAliasDeclaration)) return 'type';
  if (declaration.isKind(ts.SyntaxKind.InterfaceDeclaration)) return 'interface';
  if (declaration.isKind(ts.SyntaxKind.EnumDeclaration)) return 'enum';
};
