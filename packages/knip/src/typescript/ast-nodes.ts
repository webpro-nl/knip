import { parseSync, rawTransferSupported } from 'oxc-parser';
import { DEFAULT_EXTENSIONS } from '../constants.ts';
import { native } from '../native.ts';
import { extname } from '../util/path.ts';
import type { IgnoreExportsUsedInFile } from '../types/config.ts';
import { timerify } from '../util/Performance.ts';
import type { SymbolType } from '../types/issues.ts';

const defaultParseOptions = {
  sourceType: 'unambiguous' as const,
  experimentalRawTransfer: process.env.KNIP_DISABLE_RAW_TRANSFER !== '1' && rawTransferSupported(),
};

const parseFile = (filePath: string, sourceText: string) => {
  const ext = extname(filePath);
  const parseFileName = DEFAULT_EXTENSIONS.has(ext) ? filePath : `${filePath}.ts`;
  return parseSync(parseFileName, sourceText, defaultParseOptions);
};

export const _parseFile = timerify(parseFile);

export const isAmbientDeclarationFile = (filePath: string, sourceText: string): boolean => {
  try {
    return native.isAmbientDeclarationFile(filePath, sourceText);
  } catch {
    return false;
  }
};

export type ResolveModule = (specifier: string, containingFile: string) => ResolvedModule | undefined;

export interface ResolvedModule {
  resolvedFileName: string;
  isExternalLibraryImport: boolean;
  packageName?: string;
}

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
