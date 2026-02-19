import type { ImportNode } from '../../types/imports.ts';
import type { BoundSourceFile } from '../SourceFile.ts';
import { collectCustomImports } from './custom.ts';
import { collectTypeScriptPragmaImports } from './typescript.ts';

export const getImportsFromPragmas = (sourceFile: BoundSourceFile): ImportNode[] =>
  collectTypeScriptPragmaImports(sourceFile).concat(collectCustomImports(sourceFile));
