import type ts from 'typescript';
import type { SymbolType } from './issues.js';

type Identifier = string;

export type ExportPosTuple = [number, number];

export type ExportsWithElements = {
  element: string;
  // pos is a position of curve brackets "{ identifier, identifier2 }"
  // in  "export { identifier, identifier2 };"
  pos: ExportPosTuple;

  allExportPos: ExportPosTuple;
  allElements: string[];
};

export type CommonExport = {
  pos: ExportPosTuple;
};
export type Fix = CommonExport | ExportsWithElements | undefined;
export type Fixes = Array<Fix>;

export const isFixForExportWithElements = (fix: Fix): fix is ExportsWithElements => {
  return !!(fix as ExportsWithElements).element;
};

export type ExportNode = {
  node: ts.Node;
  symbol?: ts.Symbol;
  identifier: Identifier;
  pos: number;
  type: SymbolType;
  members?: ExportNodeMember[];
  jsDocTags?: Set<string>;
  fix: Fix;
};

export type ExportNodeMember = {
  node: ts.Node;
  identifier: Identifier;
  pos: number;
  type: SymbolType;
  fix: Fix;
};
