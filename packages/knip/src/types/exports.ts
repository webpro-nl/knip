import ts from 'typescript';
import type { SymbolType } from './issues.js';

type FilePath = string;
type Identifier = string;

export type ExportPos = [number, number] | [];

export type ExportNode = {
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

export interface SerializableExport {
  identifier: Identifier;
  pos: number;
  line: number;
  col: number;
  type: SymbolType;
  members: SerializableExportMember[];
  jsDocTags: Array<string>;
  refs: number;
  fix: ExportPos;
  symbol?: ts.Symbol;
}

export type SerializableExportMember = {
  identifier: Identifier;
  pos: number;
  line: number;
  col: number;
  type: SymbolType;
  refs: number;
  fix: ExportPos;
  symbol?: ts.Symbol;
};

export type SerializableExports = Record<Identifier, SerializableExport>;

export type SerializableExportMap = Record<FilePath, SerializableExports>;
