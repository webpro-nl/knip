import type { Tags } from '../types/cli.js';
import type { SerializableExport, SerializableExportMember } from '../types/exports.js';

export const splitTags = (tags: string[]) =>
  tags
    .flatMap(tag => tag.split(','))
    .reduce<Tags>(
      ([incl, excl], tag) => {
        (tag.startsWith('-') ? excl : incl).push(/[a-zA-Z]+/.exec(tag)![0]);
        return [incl, excl];
      },
      [[], []]
    );

const hasTag = (tags: string[], jsDocTags: string[]) => tags.some(tag => jsDocTags.includes('@' + tag));

export const shouldIgnore = (exportedItem: SerializableExport | SerializableExportMember, tags: Tags) => {
  const [includeJSDocTags, excludeJSDocTags] = tags;
  if (includeJSDocTags.length > 0 && !hasTag(includeJSDocTags, exportedItem.jsDocTags)) return true;
  if (excludeJSDocTags.length > 0 && hasTag(excludeJSDocTags, exportedItem.jsDocTags)) return true;
  return false;
};
