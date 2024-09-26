import type ts from 'typescript';
import type { SymbolType } from './issues.js';

type Identifier = string;

type ExportPosTuple = [number, number, number];
export type Fix = ExportPosTuple | undefined;
export type Fixes = Array<ExportPosTuple>;

export type ExportNode = {
  node: ts.Node;
  symbol?: ts.Symbol;
  identifier: Identifier;
  pos: number;
  type: SymbolType;
  members?: ExportNodeMember[];
  jsDocTags?: Set<string>;
  fix: Fix;
};

export type ExportNodeMember = {
  node: ts.Node;
  identifier: Identifier;
  pos: number;
  type: SymbolType;
  fix: Fix;
};
