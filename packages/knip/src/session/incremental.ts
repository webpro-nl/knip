import { isDeepStrictEqual } from 'node:util';
import type { FileNode, Imports } from '../types/module-graph.ts';

export const isIncrementalFile = (file: FileNode) =>
  file.scripts.size === 0 &&
  file.importGlobs.length === 0 &&
  file.imports.programFiles.size === 0 &&
  file.imports.entryFiles.size === 0;

export const getFileTopology = (file: FileNode) => {
  const exports = [];
  for (const [identifier, item] of file.exports) {
    const members = [];
    for (const member of item.members) {
      members.push({
        identifier: member.identifier,
        type: member.type,
        flags: member.flags,
        jsDocTags: member.jsDocTags,
        hasRefsInFile: member.hasRefsInFile,
      });
    }
    exports.push({
      identifier,
      binding: item.binding,
      type: item.type,
      jsDocTags: item.jsDocTags,
      hasRefsInFile: item.hasRefsInFile,
      isRegistered: item.isRegistered,
      referencedIn: item.referencedIn,
      isReExport: item.isReExport,
      isBindingReExport: item.isBindingReExport,
      members,
    });
  }
  const facts = (items: Imports) => {
    const result = [];
    for (const { specifier, filePath, identifier, alias, isTypeOnly, modifiers, jsDocTags } of items)
      result.push({ specifier, filePath, identifier, alias, isTypeOnly, modifiers, jsDocTags });
    return result;
  };
  return {
    internal: file.imports.internal,
    paths: [...file.imports.internal.keys()],
    imports: facts(file.imports.imports),
    external: facts(file.imports.external),
    unresolved: facts(file.imports.unresolved),
    externalRefs: file.imports.externalRefs,
    exports,
    skipExports: file.skipExports,
  };
};

export const hasSameTopology = (before: ReturnType<typeof getFileTopology>, after: FileNode) =>
  isIncrementalFile(after) && isDeepStrictEqual(before, getFileTopology(after));
