import type ts from 'typescript';

export interface ImportNode {
  readonly specifier: string;
  readonly identifier: string | undefined;
  readonly alias: string | undefined;
  readonly namespace: string | undefined;
  readonly pos: number;
  readonly symbol: ts.Symbol | undefined;
  readonly modifiers: number;
}
