import { ALIAS_TAG, BETA_TAG, INTERNAL_TAG, PUBLIC_TAG } from '../constants.js';
import type { Tags } from '../types/cli.js';

export const splitTags = (rawTags: string[]) => {
  const tags = rawTags.flatMap(tag => tag.split(','));
  return tags.reduce<Tags>(
    ([incl, excl], tag) => {
      const match = tag.match(/[a-zA-Z]+/);
      if (match) (tag.startsWith('-') ? excl : incl).push(match[0]);
      return [incl, excl];
    },
    [[], []]
  );
};

const hasTag = (tags: string[], jsDocTags: Set<string>) => tags.some(tag => jsDocTags.has(`@${tag}`));

export const shouldIgnore = (jsDocTags: Set<string>, tags: Tags) => {
  const [includeJSDocTags, excludeJSDocTags] = tags;
  if (includeJSDocTags.length > 0 && !hasTag(includeJSDocTags, jsDocTags)) return true;
  if (excludeJSDocTags.length > 0 && hasTag(excludeJSDocTags, jsDocTags)) return true;
  return false;
};

export const getShouldIgnoreHandler = (isProduction: boolean) => (jsDocTags: Set<string>) =>
  jsDocTags.has(PUBLIC_TAG) ||
  jsDocTags.has(BETA_TAG) ||
  jsDocTags.has(ALIAS_TAG) ||
  (isProduction && jsDocTags.has(INTERNAL_TAG));

export const getShouldIgnoreTagHandler = (tags: Tags) => (jsDocTags: Set<string>) => shouldIgnore(jsDocTags, tags);
