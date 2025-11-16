import type ts from 'typescript';
import type { Fix, Fixes } from './exports.js';
import type { IssueSymbol, SymbolType } from './issues.js';

type Identifier = string;
type FilePath = string;
type NamespaceOrAlias = string;

type Reference = string;
type References = Set<Reference>;

type Tags = Set<string>;

export type IdToFileMap = Map<Identifier, Set<FilePath>>;
export type IdToNsToFileMap = Map<Identifier, Map<NamespaceOrAlias, Set<FilePath>>>;

export type ImportMaps = {
  /** References to imported identifiers ("default", "named", "NS.member", etc) */
  refs: References;
  imported: IdToFileMap;
  importedAs: IdToNsToFileMap;
  importedNs: IdToFileMap;
  reExported: IdToFileMap;
  reExportedAs: IdToNsToFileMap;
  reExportedNs: IdToFileMap;
};

export type ImportMap = Map<FilePath, ImportMaps>;

export type Import = {
  specifier: string;
  identifier: string;
  pos?: number;
  line?: number;
  col?: number;
};

export interface Export {
  identifier: Identifier;
  pos: number;
  line: number;
  col: number;
  type: SymbolType;
  members: ExportMember[];
  jsDocTags: Tags;
  refs: [number, boolean];
  fixes: Fixes;
  symbol?: ts.Symbol;
}

export type ExportMember = {
  identifier: Identifier;
  pos: number;
  line: number;
  col: number;
  type: SymbolType;
  refs: [number, boolean];
  fix: Fix;
  symbol?: ts.Symbol;
  jsDocTags: Tags;
};

export type ExportMap = Map<Identifier, Export>;

export type Imports = Set<[Import, FilePath]>;

export type FileNode = {
  imports: {
    internal: ImportMap;
    external: Set<Import>;
    unresolved: Set<Import>;
    resolved: Set<FilePath>;
    imports: Imports;
  };
  exports: ExportMap;
  duplicates: Iterable<Array<IssueSymbol>>;
  scripts: Set<string>;
  imported?: ImportMaps;
  internalImportCache?: ImportMap;
  traceRefs: References;
};

export type ModuleGraph = Map<FilePath, FileNode>;
