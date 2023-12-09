import ts from 'typescript';
import type { SymbolType } from './issues.js';

type FilePath = string;
type Identifier = string;
export type ExportPos = [number, number] | [];

export type ExportItem = {
  node: ts.Node;
  pos: number;
  posDecl?: number; // declPos (position of declaration) is sometimes required for `findReferences`
  type: SymbolType;
  members?: ExportItemMember[];
  jsDocTags?: Set<string>;
  fix: ExportPos;
};

export type ExportItemMember = {
  node: ts.Node;
  identifier: Identifier;
  pos: number;
  type: SymbolType;
  fix: ExportPos;
};

export type ExportItems = Map<string, Required<ExportItem>>;

export type Exports = Map<FilePath, ExportItems>;
