import {
  parseSync,
  rawTransferSupported,
  type TSEnumDeclaration,
  type TSEnumMember,
  type TSModuleDeclaration,
} from 'oxc-parser';
import { DEFAULT_EXTENSIONS, FIX_FLAGS, SYMBOL_TYPE } from '../../constants.ts';
import { extname } from '../../util/path.ts';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile } from '../../types/config.ts';
import type { Fix } from '../../types/exports.ts';
import type { SymbolType } from '../../types/issues.ts';
import type { ExportMember } from '../../types/module-graph.ts';

const defaultParseOptions = {
  sourceType: 'unambiguous' as const,
  experimentalRawTransfer: rawTransferSupported(),
};

export const parseFile = (filePath: string, sourceText: string) => {
  const ext = extname(filePath);
  const parseFileName = DEFAULT_EXTENSIONS.has(ext) ? filePath : `${filePath}.ts`;
  return parseSync(parseFileName, sourceText, defaultParseOptions);
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

export function extractNamespaceMembers(
  decl: TSModuleDeclaration,
  options: GetImportsAndExportsOptions,
  lineStarts: number[],
  getJSDocTags: (start: number) => Set<string>,
  prefix?: string
): ExportMember[] {
  if (!decl.body || decl.body.type !== 'TSModuleBlock') return [];
  const members: ExportMember[] = [];

  const addMember = (name: string, pos: number, stmtStart: number, stmtEnd: number) => {
    const fullName = prefix ? `${prefix}.${name}` : name;
    const { line, col } = getLineAndCol(lineStarts, pos);
    const fix: Fix = options.isFixExports
      ? [stmtStart, stmtEnd, FIX_FLAGS.OBJECT_BINDING | FIX_FLAGS.WITH_NEWLINE]
      : undefined;
    members.push({
      identifier: fullName,
      type: SYMBOL_TYPE.MEMBER as SymbolType,
      pos,
      line,
      col,
      fix,
      hasRefsInFile: false,
      jsDocTags: getJSDocTags(stmtStart),
      flags: 0,
    });
  };

  for (const stmt of decl.body.body) {
    if (stmt.type !== 'ExportNamedDeclaration' || !stmt.declaration) continue;
    const d = stmt.declaration;

    if (d.type === 'VariableDeclaration') {
      for (const declarator of d.declarations) {
        if (declarator.id.type === 'Identifier') {
          addMember(declarator.id.name, declarator.id.start, stmt.start, stmt.end);
        }
      }
    } else if (d.type === 'TSModuleDeclaration' && d.kind !== 'global' && d.id.type === 'Identifier') {
      const nestedPrefix = prefix ? `${prefix}.${d.id.name}` : d.id.name;
      const nested = extractNamespaceMembers(d as TSModuleDeclaration, options, lineStarts, getJSDocTags, nestedPrefix);
      for (const m of nested) members.push(m);
    } else if (d.id && 'name' in d.id) {
      addMember(d.id.name, d.id.start, stmt.start, stmt.end);
    }
  }
  return members;
}

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
