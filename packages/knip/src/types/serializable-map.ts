import type ts from 'typescript';
import type { Fix, Fixes } from './exports.js';
import type { IssueSymbol, SymbolType } from './issues.js';

type FilePath = string;
type Reference = string;
type References = Set<Reference>;
type Tags = Set<string>;

export type IdMap = Map<string, Set<FilePath>>;
export type IdMapNs = Map<string, IdMap>; // ns or alias

export type SerializableImports = {
  refs: References;
  imported: IdMap;
  importedAs: IdMapNs;
  importedNs: IdMap;
  reExportedBy: IdMap;
  reExportedAs: IdMapNs;
  reExportedNs: IdMap;
};

export type SerializableImportMap = Map<FilePath, SerializableImports>;

export type UnresolvedImport = { specifier: string; pos?: number; line?: number; col?: number };

export interface SerializableExport {
  identifier: Reference;
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
  identifier: Reference;
  pos: number;
  line: number;
  col: number;
  type: SymbolType;
  refs: number;
  fix: Fix;
  symbol?: ts.Symbol;
  jsDocTags: Tags;
};

export type SerializableExports = Map<Reference, SerializableExport>;

export type SerializableFile = {
  internalImportCache?: SerializableImportMap;
  imports?: {
    internal: SerializableImportMap;
    external: Set<string>;
    unresolved: Set<UnresolvedImport>;
  };
  exports?: {
    exported: SerializableExports;
    duplicate: Array<Array<IssueSymbol>>;
  };
  scripts?: Set<string>;
  imported?: SerializableImports;
  traceRefs?: References;
};

export type SerializedFile = SerializableFile;

export type SerializableMap = Map<FilePath, SerializableFile>;
