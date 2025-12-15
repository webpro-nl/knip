import type ts from 'typescript';
import type { SymbolType } from './issues.js';

type Identifier = string;

type ExportPosTuple = [number, number, number];
export type Fix = ExportPosTuple | undefined;
export type Fixes = Array<ExportPosTuple>;

export type ExportNode = {
  readonly node: ts.Node;
  readonly symbol: undefined | ts.Symbol;
  readonly identifier: Identifier;
  readonly pos: number;
  readonly type: SymbolType;
  readonly members: readonly ExportNodeMember[];
  readonly jsDocTags: undefined | Set<string>;
  readonly fix: Fix;
};

export type ExportNodeMember = {
  readonly node: ts.Node;
  readonly identifier: Identifier;
  readonly pos: number;
  readonly type: SymbolType;
  readonly fix: Fix;
  readonly flags: number;
};
