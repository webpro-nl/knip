import type { Fix, Fixes } from './exports.ts';
import type { IssueSymbol, SymbolType } from './issues.ts';

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

export type ImportMaps = {
  /** Usage references cq. property-access patterns on imports ("default", "named", "NS.member", "alias.sub", "enum.member", etc.); NOT mere import usage */
  refs: References;
  /** Identifiers imported from this file */
  import: IdToFileMap;
  /** Identifiers imported with alias (id → alias → files) */
  importAs: IdToNsToFileMap;
  /** Namespace imports of this file */
  importNs: IdToFileMap;
  /** Identifiers re-exported (not directly imported) */
  reExport: IdToFileMap;
  /** Namespace re-exports */
  reExportNs: IdToFileMap;
  /** Irregular re-exports: id → namespace/alias → source files */
  reExportAs: IdToNsToFileMap;
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
  hasRefsInFile: boolean;
  referencedIn: Set<string> | undefined;
  readonly fixes: Fixes;
  readonly isReExport: boolean;
}

export interface ExportMember extends Position {
  readonly identifier: Identifier;
  readonly type: SymbolType;
  readonly fix: Fix;
  readonly jsDocTags: Tags;
  readonly flags: number;
  hasRefsInFile: boolean;
}

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
  /** Aggregation of other files importing this file's exports */
  importedBy: undefined | ImportMaps;
  internalImportCache: undefined | ImportMap;
};

export type ModuleGraph = Map<FilePath, FileNode>;
