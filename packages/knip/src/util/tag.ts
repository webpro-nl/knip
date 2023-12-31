export const splitTags = (tags: string[]) =>
  tags
    .flatMap(tag => tag.split(','))
    .reduce<[string[], string[]]>(
      ([incl, excl], tag) => {
        (tag.startsWith('-') ? excl : incl).push(tag.match(/[a-zA-Z]+/)![0]);
        return [incl, excl];
      },
      [[], []]
    );

export const hasTag = (tags: string[], jsDocTags: string[]) => tags.some(tag => jsDocTags.includes('@' + tag));
