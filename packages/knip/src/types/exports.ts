import ts from 'typescript';
import type { SymbolType } from './issues.js';

type FilePath = string;
type Identifier = string;
export type ExportPos = [number, number] | [];

export type ExportedNode = {
  node: ts.Node;
  identifier: Identifier;
  pos: number;
  type: SymbolType;
  members?: ExportNodeMember[];
  jsDocTags?: Set<string>;
  fix: ExportPos;
};

type ExportNodeMember = {
  node: ts.Node;
  identifier: Identifier;
  pos: number;
  type: SymbolType;
  fix: ExportPos;
};

export interface ExportItem {
  identifier: Identifier;
  pos: number;
  line: number;
  col: number;
  type: SymbolType;
  members: ExportItemMember[];
  jsDocTags: Array<string>;
  refs: number;
  fix: ExportPos;
  symbol?: ts.Symbol;
}

export type ExportItemMember = {
  identifier: Identifier;
  pos: number;
  line: number;
  col: number;
  type: SymbolType;
  refs: number;
  fix: ExportPos;
  symbol?: ts.Symbol;
};

export type ExportItems = Record<string, ExportItem>;

export type Exports = Record<FilePath, ExportItems>;
