/** @internal */
// `dir/*` matches direct children; gitignore also ignores their contents (deep), but CODEOWNERS
// ownership is shallow (direct files only). Default is deep; shallow callers (codeowners) opt in.
export const toExtendedIgnorePattern = (pattern: string, shallow = false): string => {
  if (pattern === '*' || pattern === '**') return pattern;
  if (shallow && pattern.endsWith('/*')) return pattern;
  return `${pattern}/**`;
};

export const expandIgnorePatterns = (patterns: Iterable<string>, shallow = false): string[] => {
  const result: string[] = [];
  for (const p of patterns) {
    result.push(p);
    const ext = toExtendedIgnorePattern(p, shallow);
    if (ext !== p) result.push(ext);
  }
  return result;
};

export const convertGitignoreToPicomatchIgnorePatterns = (pattern: string) => {
  const negated = pattern[0] === '!';
  if (negated) pattern = pattern.slice(1);
  if (pattern.endsWith('/')) pattern = pattern.slice(0, -1);
  if (pattern.startsWith('*/**/')) pattern = pattern.slice(5);
  if (pattern === '*' || pattern === '**') return { negated, pattern };
  if (pattern.startsWith('/')) pattern = pattern.slice(1);
  else if (!pattern.startsWith('**/')) pattern = `**/${pattern}`;
  return { negated, pattern };
};

export const parseAndConvertGitignorePatterns = (patterns: string, ancestor?: string) => {
  const matchFrom = ancestor ? new RegExp(`^(!?/?)(${ancestor})`) : undefined;
  return patterns
    .split(/\r?\n/)
    .filter(line => line.trim() && !line.startsWith('#'))
    .flatMap(line => {
      const pattern = line.replace(/^\\(?=#)/, '').trim();
      if (ancestor && matchFrom) {
        if (pattern.match(matchFrom)) return [pattern.replace(matchFrom, '$1')];
        if (pattern.startsWith('/**/')) return [pattern.slice(1)];
        if (pattern.startsWith('!/**/')) return [`!${pattern.slice(2)}`];
        if (pattern.startsWith('/') || pattern.startsWith('!/')) return [];
      }
      return [pattern];
    })
    .map(pattern => convertGitignoreToPicomatchIgnorePatterns(pattern));
};
