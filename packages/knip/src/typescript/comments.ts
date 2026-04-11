import type { Comment } from 'oxc-parser';
import { IMPORT_FLAGS } from '../constants.ts';

const jsDocImportRe = /import\(\s*['"]([^'"]+)['"]\s*\)(?:\.(\w+))?/g;
const jsDocImportTagRe = /@import\s+(?:\{[^}]*\}|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
const jsxImportSourceRe = /@jsxImportSource\s+(\S+)/;
const referenceTypesRe = /\s*<reference\s+types\s*=\s*"([^"]+)"[^/]*\/>/;
const envPragmaRe = /@(vitest|jest)-environment\s+([@\w./-]+)/g;

const resolveEnvironmentPragma = (tool: string, value: string): string | undefined => {
  if (value === 'node') return undefined;
  if (value.startsWith('.') || value.startsWith('/')) return value;
  if (tool === 'jest') {
    if (value === 'jsdom') return 'jest-environment-jsdom';
    return value;
  }
  if (value === 'edge-runtime') return '@edge-runtime/vm';
  return value;
};

type CommentImportAdder = (
  specifier: string,
  identifier: string | undefined,
  alias: string | undefined,
  namespace: string | undefined,
  pos: number,
  modifiers: number
) => void;

export const extractImportsFromComments = (
  comments: readonly Comment[],
  firstStmtStart: number,
  addImport: CommentImportAdder
) => {
  for (const comment of comments) {
    const text = comment.value;

    let results: RegExpExecArray | null;
    if (comment.type === 'Block') {
      jsDocImportRe.lastIndex = 0;
      while ((results = jsDocImportRe.exec(text)) !== null) {
        const before = text.slice(0, results.index);
        const lastOpen = before.lastIndexOf('{');
        if (lastOpen === -1 || before.indexOf('}', lastOpen) !== -1) continue;
        const specifier = results[1];
        const member = results[2];
        addImport(specifier, member, undefined, undefined, comment.start + results.index, IMPORT_FLAGS.TYPE_ONLY);
      }

      jsDocImportTagRe.lastIndex = 0;
      while ((results = jsDocImportTagRe.exec(text)) !== null) {
        const specifier = results[1];
        addImport(specifier, undefined, undefined, undefined, comment.start + results.index, IMPORT_FLAGS.TYPE_ONLY);
      }
    }

    const jsxMatch = text.match(jsxImportSourceRe);
    if (jsxMatch) {
      addImport(jsxMatch[1], undefined, undefined, undefined, comment.start, IMPORT_FLAGS.TYPE_ONLY);
    }

    if (comment.end <= firstStmtStart) {
      envPragmaRe.lastIndex = 0;
      while ((results = envPragmaRe.exec(text)) !== null) {
        const id = resolveEnvironmentPragma(results[1], results[2]);
        if (!id) continue;
        const isLocal = id.startsWith('.') || id.startsWith('/');
        const modifiers = isLocal ? IMPORT_FLAGS.ENTRY : IMPORT_FLAGS.NONE;
        addImport(id, undefined, undefined, undefined, comment.start + results.index, modifiers);
      }
    }

    if (comment.type === 'Line') {
      const refMatch = comment.value.match(referenceTypesRe);
      if (refMatch) {
        addImport(refMatch[1], undefined, undefined, undefined, comment.start, IMPORT_FLAGS.TYPE_ONLY);
      }
    }
  }
};
