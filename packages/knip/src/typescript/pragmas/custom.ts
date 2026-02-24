import { IMPORT_FLAGS } from '../../constants.ts';
import { getEnvSpecifier } from '../../plugins/vitest/helpers.ts';
import type { ImportNode } from '../../types/imports.ts';
import { isAbsolute, isInternal } from '../../util/path.ts';
import { getLeadingComments, stripQuotes } from '../ast-helpers.ts';
import type { BoundSourceFile } from '../SourceFile.ts';

const VITEST_ENV = /@(vitest|jest)-environment\s+(\S+)/g;

export const collectCustomImports = (sourceFile: BoundSourceFile): ImportNode[] => {
  const comments = getLeadingComments(sourceFile);
  if (!comments.length) return [];

  const importNodes: ImportNode[] = [];

  for (const comment of comments) {
    let match: RegExpExecArray | null;
    // oxlint-disable-next-line no-cond-assign
    while ((match = VITEST_ENV.exec(comment.text)) !== null) {
      const id = stripQuotes(match[2].trim());
      if (!id) continue;
      const isLocal = isInternal(id) || isAbsolute(id);
      const modifiers = isLocal ? IMPORT_FLAGS.ENTRY : IMPORT_FLAGS.NONE;
      const offset = match[0].length - match[2].length;
      const specifier = isLocal || id === 'node' ? id : getEnvSpecifier(id);
      importNodes.push({
        specifier,
        identifier: undefined,
        pos: comment.pos + match.index + offset,
        modifiers,
        alias: undefined,
        namespace: undefined,
        symbol: undefined,
      });
    }
  }

  return importNodes;
};
