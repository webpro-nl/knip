/** @internal */
export const convertGitignoreToPicomatchIgnorePatterns = (pattern: string) => {
  const negated = pattern[0] === '!';

  if (negated) pattern = pattern.slice(1);

  let extPattern: string;

  if (pattern.endsWith('/')) pattern = pattern.slice(0, -1);
  if (pattern.startsWith('*/**/')) pattern = pattern.slice(5);

  if (pattern === '*' || pattern === '**') return { negated, patterns: [pattern, pattern] };

  if (pattern.startsWith('/')) pattern = pattern.slice(1);
  else if (!pattern.startsWith('**/')) pattern = `**/${pattern}`;

  if (pattern.endsWith('/*')) extPattern = pattern;
  else extPattern = `${pattern}/**`;

  return { negated, patterns: [pattern, extPattern] };
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
