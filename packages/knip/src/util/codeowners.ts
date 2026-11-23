import { readFileSync } from 'node:fs';
import picomatch from 'picomatch';
import { debugLog } from './debug.ts';
import { convertGitignoreToPicomatchIgnorePatterns, expandIgnorePatterns } from './parse-and-convert-gitignores.ts';

/** @internal */
export function parseCodeowners(content: string) {
  const matchers = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(rule => {
      const [path, ...tokens] = rule.split(/\s+/);
      // An inline comment (`*.js @owner # comment`) ends the list of owners
      const comment = tokens.findIndex(token => token.startsWith('#'));
      const owners = comment === -1 ? tokens : tokens.slice(0, comment);
      // CODEOWNERS sits at the root, so a slash at the start or in the middle anchors a pattern there
      const { pattern } = convertGitignoreToPicomatchIgnorePatterns(path, true);
      // A bare `*` owns files at any depth, as in gitignore
      const glob = path === '*' ? '**' : pattern;
      // CODEOWNERS `dir/*` is shallow: it owns direct files only, not nested subdirectories
      return { owners, match: picomatch(expandIgnorePatterns([glob], true), { dot: true }) };
    });

  return (filePath: string) => {
    for (const matcher of matchers.toReversed()) {
      if (matcher.match(filePath)) {
        return matcher.owners;
      }
    }
    return [];
  };
}

export function createOwnershipEngine(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return parseCodeowners(content);
  } catch (error) {
    debugLog('*', `Failed to load codeowners file from ${filePath}`);
    throw error;
  }
}
