import ts from 'typescript';
import type { SymbolType } from './issues.js';

type FilePath = string;
type Specifier = string;
type Identifier = string;

type ImportItems = Set<Identifier>;

export type ImportedModule = {
  specifier: Specifier;
  symbols: ImportItems;
  isStar: boolean;
  isReExported: boolean;
  isReExportedBy: Set<string>;
};

export type Imports = Map<FilePath, ImportedModule>;

export type ExportItem = {
  node: ts.Node;
  pos: number;
  type: SymbolType;
  members?: ExportItemMember[];
};

export type ExportItemMember = {
  node: ts.Node;
  identifier: Identifier;
  pos: number;
  type: string; // TODO: should be SymbolType
};

export type ExportItems = Map<string, ExportItem>;

export type Exports = Map<FilePath, ExportItems>;
