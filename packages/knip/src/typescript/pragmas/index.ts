import type { ImportNode } from '../../types/imports.js';
import type { BoundSourceFile } from '../SourceFile.js';
import { collectCustomImports } from './custom.js';
import { collectTypeScriptPragmaImports } from './typescript.js';

export const getImportsFromPragmas = (sourceFile: BoundSourceFile): ImportNode[] =>
  collectTypeScriptPragmaImports(sourceFile).concat(collectCustomImports(sourceFile));
