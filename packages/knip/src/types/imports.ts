type FilePath = string;
type Specifier = string;
type Identifier = string;

type ImportItems = Array<Identifier>;

export type ImportsForExport = {
  specifier: Specifier;
  symbols: ImportItems;
  hasStar: boolean;
  isReExport: boolean;
  isImportedBy: Set<string>;
  importedNs: Set<string>;
  isReExportedBy: Set<string>;
  isReExportedAs: Set<[string, string]>;
};

export type Imports = Record<FilePath, ImportsForExport>;

export type UnresolvedImport = { specifier: string; pos?: number; line?: number; col?: number };
