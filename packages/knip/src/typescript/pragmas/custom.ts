import { IMPORT_MODIFIERS } from '../../constants.js';
import { getEnvSpecifier } from '../../plugins/vitest/helpers.js';
import type { ImportNode } from '../../types/imports.js';
import { isAbsolute, isInternal } from '../../util/path.js';
import { getLeadingComments, stripQuotes } from '../ast-helpers.js';
import type { BoundSourceFile } from '../SourceFile.js';

const VITEST_ENV = /@(vitest|jest)-environment\s+(\S+)/g;

export const collectCustomImports = (sourceFile: BoundSourceFile): ImportNode[] => {
  const comments = getLeadingComments(sourceFile);
  if (!comments.length) return [];

  const importNodes: ImportNode[] = [];

  for (const comment of comments) {
    let match: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: deal with it
    while ((match = VITEST_ENV.exec(comment.text)) !== null) {
      const id = stripQuotes(match[2].trim());
      if (!id) continue;
      const isLocal = isInternal(id) || isAbsolute(id);
      const modifiers = isLocal ? IMPORT_MODIFIERS.ENTRY : IMPORT_MODIFIERS.NONE;
      const offset = match[0].length - match[2].length;
      const specifier = isLocal ? id : getEnvSpecifier(id);
      importNodes.push({ specifier, identifier: undefined, pos: comment.pos + match.index + offset, modifiers });
    }
  }

  return importNodes;
};
