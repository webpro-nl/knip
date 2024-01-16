import ts from 'typescript';
import type { SymbolType } from './issues.js';

type FilePath = string;
type Identifier = string;
type Tags = Array<string>;

type ExportPosTuple = [number, number];
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

export interface SerializableExport {
  identifier: Identifier;
  pos: number;
  line: number;
  col: number;
  type: SymbolType;
  members: SerializableExportMember[];
  jsDocTags: Tags;
  refs: number;
  fixes: Fixes;
  symbol?: ts.Symbol;
}

export type SerializableExportMember = {
  identifier: Identifier;
  pos: number;
  line: number;
  col: number;
  type: SymbolType;
  refs: number;
  fix: Fix;
  symbol?: ts.Symbol;
  jsDocTags: Tags;
};

export type SerializableExports = Record<Identifier, SerializableExport>;

export type SerializableExportMap = Record<FilePath, SerializableExports>;
