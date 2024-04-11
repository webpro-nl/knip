import type ts from 'typescript';

export interface ImportNode {
  specifier: string;
  identifier: string | undefined;
  pos: number | undefined;
  symbol?: ts.Symbol;
  isTypeOnly?: boolean;
  isReExport?: boolean;
}
