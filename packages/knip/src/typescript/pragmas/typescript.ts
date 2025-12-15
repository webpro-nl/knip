import { IMPORT_FLAGS } from '../../constants.js';
import type { ImportNode } from '../../types/imports.js';
import type { BoundSourceFile } from '../SourceFile.js';

export const collectTypeScriptPragmaImports = (sourceFile: BoundSourceFile): ImportNode[] => {
  if (!sourceFile.pragmas || sourceFile.pragmas.size === 0) return [];

  const importNodes: ImportNode[] = [];
  const modifiers = IMPORT_FLAGS.TYPE_ONLY;

  const jsxImportSourcePragmas = sourceFile.pragmas.get('jsximportsource');
  if (jsxImportSourcePragmas) {
    const jsxImportSourcePragma = Array.isArray(jsxImportSourcePragmas)
      ? jsxImportSourcePragmas[jsxImportSourcePragmas.length - 1]
      : jsxImportSourcePragmas;
    const { factory: specifier } = jsxImportSourcePragma?.arguments ?? {};
    const pos = jsxImportSourcePragma.range?.pos ?? 0;
    if (specifier) importNodes.push({ specifier, identifier: undefined, pos, modifiers });
  }

  const referencePragma = sourceFile.pragmas.get('reference');
  if (referencePragma) {
    const refs = [referencePragma].flat();
    for (const ref of refs) {
      if (ref.arguments?.types) {
        const { value: specifier, pos } = ref.arguments.types;
        if (specifier) importNodes.push({ specifier, identifier: undefined, pos, modifiers });
      }
    }
  }

  return importNodes;
};
