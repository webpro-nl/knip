import type ts from 'typescript';
import type { Fix, Fixes } from './exports.js';
import type { IssueSymbol, SymbolType } from './issues.js';

export type Identifier = string;
type FilePath = string;
type NamespaceOrAlias = string;

type Reference = string;
type References = Set<Reference>;

type Tags = Set<string>;

interface SourceLocation {
  pos: number;
  line: number;
  col: number;
}

export type IdToFileMap = Map<Identifier, Set<FilePath>>;
export type IdToNsToFileMap = Map<Identifier, Map<NamespaceOrAlias, Set<FilePath>>>;

/** Aggregated imports from other files (who imports this file's exports) */
export type ImportMaps = {
  /** Usage references to imported identifiers ("default", "named", "NS.export", "enum.member", etc.) */
  refs: References;
  /** Directly imported identifiers */
  imported: IdToFileMap;
  importedAs: IdToNsToFileMap;
  importedNs: IdToFileMap;
  /** Identifiers re-exported (not directly imported) */
  reExported: IdToFileMap;
  reExportedAs: IdToNsToFileMap;
  reExportedNs: IdToFileMap;
};

export type ImportMap = Map<FilePath, ImportMaps>;

export interface Import extends SourceLocation {
  specifier: string;
  filePath: string | undefined;
  identifier: string | undefined;
  isTypeOnly: boolean;
}

export interface Export extends SourceLocation {
  identifier: Identifier;
  type: SymbolType;
  members: ExportMember[];
  jsDocTags: Tags;
  self: [number, boolean];
  fixes: Fixes;
  symbol: undefined | ts.Symbol;
  isReExport: boolean;
}

export type ExportMember = {
  identifier: Identifier;
  pos: number;
  line: number;
  col: number;
  type: SymbolType;
  self: [number, boolean];
  fix: Fix;
  symbol: undefined | ts.Symbol;
  jsDocTags: Tags;
  flags: number;
};

export type ExportMap = Map<Identifier, Export>;

export type Imports = Set<Import>;

export type FileNode = {
  imports: {
    internal: ImportMap;
    external: Set<Import>;
    unresolved: Set<Import>;
    programFiles: Set<FilePath>;
    entryFiles: Set<FilePath>;
    imports: Imports;
  };
  exports: ExportMap;
  duplicates: Iterable<Array<IssueSymbol>>;
  scripts: Set<string>;
  imported?: ImportMaps;
  internalImportCache?: ImportMap;
};

export type ModuleGraph = Map<FilePath, FileNode>;
