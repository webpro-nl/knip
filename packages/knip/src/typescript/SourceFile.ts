import type ts from 'typescript';

// The members of ts.SourceFile below are added by binding and not public, so we add them here

// Overriding a SymbolTable to use string instead of __String as key (type SymbolTable = UnderscoreEscapedMap<Symbol>)
type SymbolTable = Map<string, SymbolWithExportSymbol>;

type SymbolWithExports = ts.Symbol & {
  exports?: SymbolTable;
};

interface SymbolWithExportSymbol extends ts.Symbol {
  exportSymbol?: ts.Symbol;
}

export interface SymbolWithLinks extends ts.Symbol {
  links?: {
    mapper?: {
      target: {
        aliasSymbol?: ts.Symbol;
        symbol: ts.Symbol;
      };
    };
  };
}

type PragmaMap = {
  arguments: {
    factory?: string;
    path?: { value?: string; pos?: number };
    types?: { value?: string; pos?: number };
  };
  range?: {
    kind?: number;
    pos?: number;
    end?: number;
    hasTrailingNewLine?: boolean;
  };
};

export interface BoundSourceFile extends ts.SourceFile {
  symbol?: SymbolWithExports;

  locals?: SymbolTable;

  getNamedDeclarations?(): Map<string, readonly ts.Declaration[]>;

  scriptKind?: ts.ScriptKind;

  pragmas?: Map<string, PragmaMap | PragmaMap[]>;
}
