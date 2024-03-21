import type { Tags } from '../types/cli.js';

export const splitTags = (tags: string[]) =>
  tags
    .flatMap(tag => tag.split(','))
    .reduce<Tags>(
      ([incl, excl], tag) => {
        (tag.startsWith('-') ? excl : incl).push(tag.match(/[a-zA-Z]+/)![0]);
        return [incl, excl];
      },
      [[], []]
    );

const hasTag = (tags: string[], jsDocTags: string[]) => tags.some(tag => jsDocTags.includes('@' + tag));

export const shouldIgnore = (jsDocTags: string[], tags: Tags) => {
  const [includeJSDocTags, excludeJSDocTags] = tags;
  if (includeJSDocTags.length > 0 && !hasTag(includeJSDocTags, jsDocTags)) return true;
  if (excludeJSDocTags.length > 0 && hasTag(excludeJSDocTags, jsDocTags)) return true;
  return false;
};
