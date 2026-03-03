import { rawTransferSupported, type TSEnumDeclaration, type TSEnumMember } from 'oxc-parser';
import { FIX_FLAGS, SYMBOL_TYPE } from '../../constants.ts';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile } from '../../types/config.ts';
import type { Fix } from '../../types/exports.ts';
import type { SymbolType } from '../../types/issues.ts';
import type { ExportMember } from '../../types/module-graph.ts';

export const STANDARD_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.d.ts',
  '.d.mts',
  '.d.cts',
]);

export const defaultParseOptions = {
  sourceType: 'unambiguous' as const,
  experimentalRawTransfer: rawTransferSupported(),
};

export type ResolveModule = (specifier: string, containingFile: string) => ResolvedModule | undefined;

export interface ResolvedModule {
  resolvedFileName: string;
  isExternalLibraryImport: boolean;
}

export const buildLineStarts = (sourceText: string): number[] => {
  const starts = [0];
  for (let i = 0; i < sourceText.length; i++) {
    if (sourceText.charCodeAt(i) === 10) starts.push(i + 1);
  }
  return starts;
};

export const getLineAndCol = (lineStarts: number[], pos: number): { line: number; col: number } => {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= pos) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, col: pos - lineStarts[lo] + 1 };
};

const isQuoteOrBacktick = (ch: number) => ch === 39 || ch === 34 || ch === 96;

export const stripQuotes = (name: string) => {
  const length = name.length;
  if (length >= 2 && name.charCodeAt(0) === name.charCodeAt(length - 1) && isQuoteOrBacktick(name.charCodeAt(0)))
    return name.substring(1, length - 1);
  return name;
};

export const isStringLiteral = (node: any): boolean =>
  node?.type === 'StringLiteral' ||
  (node?.type === 'Literal' && typeof node.value === 'string') ||
  (node?.type === 'TemplateLiteral' && node.quasis?.length === 1 && node.expressions?.length === 0);

export const getStringValue = (node: any): string | undefined => {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral' && node.quasis?.length === 1 && node.expressions?.length === 0)
    return node.quasis[0].value?.cooked ?? node.quasis[0].value?.raw;
  return undefined;
};

export const shouldCountRefs = (ignoreExportsUsedInFile: IgnoreExportsUsedInFile, type: SymbolType) =>
  ignoreExportsUsedInFile === true ||
  (typeof ignoreExportsUsedInFile === 'object' && type !== 'unknown' && ignoreExportsUsedInFile[type]);

export function extractEnumMembers(
  decl: TSEnumDeclaration,
  options: GetImportsAndExportsOptions,
  lineStarts: number[],
  getJSDocTags: (start: number) => Set<string>
): ExportMember[] {
  if (!decl.body?.members) return [];
  return decl.body.members.map((member: TSEnumMember) => {
    const name =
      member.id.type === 'Identifier'
        ? member.id.name
        : member.id.type === 'Literal'
          ? member.id.raw
            ? stripQuotes(member.id.raw)
            : member.id.value
          : '';
    const pos = member.id.start;
    const { line, col } = getLineAndCol(lineStarts, pos);
    const fix: Fix = options.isFixExports
      ? [member.start, member.end, FIX_FLAGS.OBJECT_BINDING | FIX_FLAGS.WITH_NEWLINE]
      : undefined;
    const jsDocTags = getJSDocTags(member.start);
    return {
      identifier: name,
      type: SYMBOL_TYPE.MEMBER as SymbolType,
      pos,
      line,
      col,
      fix,
      hasRefsInFile: name === '',
      jsDocTags,
      flags: 0,
    };
  });
}
