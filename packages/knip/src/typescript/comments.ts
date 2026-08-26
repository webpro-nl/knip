import { parseSync, type Comment, type StaticImport } from 'oxc-parser';
import { IMPORT_FLAGS } from '../constants.ts';

const jsDocImportRe = /import\(\s*['"]([^'"]+)['"]\s*\)(?:\.(\w+))?/g;
const jsDocTypeTagRe =
  /@(?:type|typedef|callback|param|arg|argument|property|prop|returns?|yields?|throws?|exception|this|extends|augments|implements|enum|template|satisfies|const|constant|member|var|namespace|module)\b/;
const jsxImportSourceRe = /@jsxImportSource\s+(\S+)/;
const referenceRe = /\s*<reference\s+(types|path)\s*=\s*"([^"]+)"[^/]*\/>/;
const envPragmaRe = /@(vitest|jest)-environment\s+([@\w./-]+)/g;
const jsDocImportTag = '@import';
const jsDocParseOptions = { sourceType: 'module' as const };

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

const isWhitespace = (char: number) => char === 9 || char === 10 || char === 13 || char === 32;
const isHorizontalWhitespace = (char: number) => char === 9 || char === 13 || char === 32;

const isJsDocTagStart = (text: string, index: number) => {
  let pos = text.lastIndexOf('\n', index - 1) + 1;
  while (isWhitespace(text.charCodeAt(pos))) pos++;
  if (text.charCodeAt(pos) === 42) {
    pos++;
    while (isWhitespace(text.charCodeAt(pos))) pos++;
  }
  return pos === index;
};

const getJsDocImportSource = (text: string, index: number) => {
  let source = 'import type';
  let pos = index + jsDocImportTag.length;

  while (pos < text.length) {
    const lineEnd = text.indexOf('\n', pos);
    if (lineEnd === -1) return source + text.slice(pos);
    source += text.slice(pos, lineEnd);

    let nextLine = lineEnd + 1;
    while (isHorizontalWhitespace(text.charCodeAt(nextLine))) nextLine++;
    if (text.charCodeAt(nextLine) === 42) {
      nextLine++;
      while (isHorizontalWhitespace(text.charCodeAt(nextLine))) nextLine++;
    }
    if (text.charCodeAt(nextLine) === 64) return source;

    source += '\n';
    pos = nextLine;
  }

  return source;
};

const parseJsDocImport = (text: string, index: number): StaticImport | undefined => {
  const source = getJsDocImportSource(text, index);
  const imported = parseSync('jsdoc.ts', source, jsDocParseOptions).module.staticImports[0];
  return imported?.moduleRequest.value ? imported : undefined;
};

const isInJsDocTypeExpression = (text: string, index: number) => {
  let depth = 0;
  for (let pos = index - 1; pos >= 0; pos--) {
    const char = text.charCodeAt(pos);
    if (char === 125) {
      depth++;
    } else if (char === 123) {
      if (depth > 0) {
        depth--;
      } else {
        const line = text.slice(text.lastIndexOf('\n', pos - 1) + 1, pos);
        if (jsDocTypeTagRe.test(line)) return true;
      }
    }
  }
  return false;
};

const addJsDocImport = (imported: StaticImport, pos: number, addImport: CommentImportAdder) => {
  const specifier = imported.moduleRequest.value;

  if (imported.entries.length === 0) {
    addImport(specifier, undefined, undefined, undefined, pos, IMPORT_FLAGS.TYPE_ONLY);
    return;
  }

  for (const entry of imported.entries) {
    if (entry.importName.kind === 'NamespaceObject') {
      addImport(specifier, undefined, undefined, undefined, pos, IMPORT_FLAGS.TYPE_ONLY | IMPORT_FLAGS.OPAQUE);
    } else {
      const localName = entry.localName.value;
      const identifier = entry.importName.kind === 'Default' ? 'default' : entry.importName.name!;
      const alias = localName === identifier ? undefined : localName;
      addImport(specifier, identifier, alias, undefined, pos, IMPORT_FLAGS.TYPE_ONLY);
    }
  }
};

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
        if (!isInJsDocTypeExpression(text, results.index)) continue;
        const specifier = results[1];
        const member = results[2];
        addImport(specifier, member, undefined, undefined, comment.start + results.index, IMPORT_FLAGS.TYPE_ONLY);
      }

      let index = text.indexOf(jsDocImportTag);
      while (index !== -1) {
        const next = index + jsDocImportTag.length;
        if (isJsDocTagStart(text, index) && isWhitespace(text.charCodeAt(next))) {
          const imported = parseJsDocImport(text, index);
          if (imported) addJsDocImport(imported, comment.start + index, addImport);
        }
        index = text.indexOf(jsDocImportTag, next);
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
      const refMatch = comment.value.match(referenceRe);
      if (refMatch) {
        const flags = IMPORT_FLAGS.TYPE_ONLY | (refMatch[1] === 'path' ? IMPORT_FLAGS.OPTIONAL : 0);
        addImport(refMatch[2], undefined, undefined, undefined, comment.start, flags);
      }
    }
  }
};
