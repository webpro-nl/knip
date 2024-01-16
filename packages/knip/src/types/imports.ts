import ts from 'typescript';

export interface ImportNode {
  specifier: string;
  identifier: string | undefined;
  pos: number | undefined;
  symbol?: ts.Symbol;
  isTypeOnly?: boolean;
  isReExport?: boolean;
}

type FilePath = string;
type Specifier = string;
type Identifier = string;
type Identifiers = Set<Identifier>;

export type SerializableImports = {
  specifier: Specifier;
  identifiers: Identifiers;
  hasStar: boolean;
  importedNs: Set<string>;
  isReExport: boolean;
  isReExportedBy: Set<string>;
  isReExportedAs: Set<[string, string]>;
  isReExportedNs: Set<[string, string]>;
};

export type SerializableImportMap = Record<FilePath, SerializableImports>;

export type UnresolvedImport = { specifier: string; pos?: number; line?: number; col?: number };
