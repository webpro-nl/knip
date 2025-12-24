import type ts from 'typescript';
import type { Fix, Fixes } from './exports.js';
import type { IssueSymbol, SymbolType } from './issues.js';

export type Identifier = string;
type FilePath = string;
type NamespaceOrAlias = string;

type Reference = string;
type References = Set<Reference>;

type Tags = Set<string>;

export interface Position {
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

export interface Import extends Position {
  readonly specifier: string;
  readonly filePath: string | undefined;
  readonly identifier: string | undefined;
  readonly isTypeOnly: boolean;
}

export interface ExternalRef {
  readonly specifier: string;
  readonly identifier: string | undefined;
}

export interface Export extends Position {
  readonly identifier: Identifier;
  readonly type: SymbolType;
  readonly members: ExportMember[];
  readonly jsDocTags: Tags;
  self: [number, boolean];
  readonly fixes: Fixes;
  symbol: undefined | ts.Symbol;
  readonly isReExport: boolean;
}

export type ExportMember = {
  readonly identifier: Identifier;
  readonly pos: number;
  readonly line: number;
  readonly col: number;
  readonly type: SymbolType;
  readonly fix: Fix;
  readonly jsDocTags: Tags;
  readonly flags: number;
  self: [number, boolean];
  symbol: undefined | ts.Symbol;
};

export type ExportMap = Map<Identifier, Export>;

export type Imports = Set<Import>;

export type FileNode = {
  imports: {
    readonly internal: ImportMap;
    readonly external: Set<Import>;
    readonly externalRefs: Set<ExternalRef>;
    unresolved: Set<Import>;
    readonly programFiles: Set<FilePath>;
    readonly entryFiles: Set<FilePath>;
    readonly imports: Imports;
  };
  exports: ExportMap;
  duplicates: Iterable<Array<IssueSymbol>>;
  scripts: Set<string>;
  imported: undefined | ImportMaps;
  internalImportCache: undefined | ImportMap;
};

export type ModuleGraph = Map<FilePath, FileNode>;
