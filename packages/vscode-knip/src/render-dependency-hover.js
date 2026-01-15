import { pathToFileURL } from 'node:url';
import { toMarkdown } from 'mdast-util-to-markdown';
import { u } from 'unist-builder';

/**
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @import { DependencyNodes } from 'knip/session';
 */

/**
 * @typedef {{
 *   filePath: string;
 *   line: number | undefined;
 *   col: number | undefined;
 *   snippet: string | undefined
 * }} DependencySnippet
 */

/** @param {string} text */
const replaceLessThan = text => text.replace(/</g, '‹');

const MAX_TOTAL_SNIPPETS = 30;
const MAX_SNIPPETS_PER_FILE = 3;

/**
 * @param {DependencyNodes} usage
 * @param {string} root
 * @param {DependencySnippet[]} snippets
 * @returns {{ kind: 'markdown'; value: string } | null}
 */
export function renderDependencyHover(usage, root, snippets) {
  const { packageName, imports } = usage;

  if (imports.length === 0) return null;

  const uniqueFiles = new Set(imports.map(_import => _import.filePath));
  const fileCount = uniqueFiles.size;
  const _root = `${root}/`;
  const escapedName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const packageNameMatch = new RegExp(`(?<=['"\`])${escapedName}(?=['"\`/])`, 'g');

  /** @type {Set<string>} */
  const binaryNames = new Set();
  for (const _import of imports) {
    if (_import.binaryName && _import.binaryName !== packageName) binaryNames.add(_import.binaryName);
  }

  /** @type {PhrasingContent[]} */
  const nodes = [
    u('text', `At least ${fileCount} file${fileCount > 1 ? 's' : ''} reference${fileCount > 1 ? '' : 's'} `),
    u('strong', [u('text', packageName)]),
  ];

  if (binaryNames.size > 0) nodes.push(u('text', ` (${[...binaryNames].join(', ')})`));

  snippets.sort((a, b) => a.filePath.localeCompare(b.filePath));

  /** @type {Map<string, DependencySnippet[]>} */
  const snippetsByFile = new Map();
  for (const snippet of snippets) {
    if (!snippetsByFile.has(snippet.filePath)) snippetsByFile.set(snippet.filePath, []);
    snippetsByFile.get(snippet.filePath)?.push(snippet);
  }

  let totalSnippetsShown = 0;

  for (const [filePath, fileSnippets] of snippetsByFile) {
    const relativePath = filePath.replace(_root, '');
    const firstSnippet = fileSnippets[0];
    const uri = pathToFileURL(filePath).toString();
    const position = firstSnippet.line && firstSnippet.col ? `#${firstSnippet.line},${firstSnippet.col}` : '';

    nodes.push(u('break'));
    nodes.push(u('link', { url: `${uri}${position}` }, [u('text', relativePath)]));

    if (totalSnippetsShown >= MAX_TOTAL_SNIPPETS) continue;

    const remainingBudget = MAX_TOTAL_SNIPPETS - totalSnippetsShown;
    const maxForThisFile = Math.min(MAX_SNIPPETS_PER_FILE, remainingBudget);
    const limitedSnippets = fileSnippets.slice(0, maxForThisFile);
    const snippetsOmittedInFile = fileSnippets.length - limitedSnippets.length;
    totalSnippetsShown += limitedSnippets.length;

    for (const snippet of limitedSnippets) {
      if (!snippet.snippet) continue;

      const snippetUri = pathToFileURL(filePath).toString();
      const snippetPosition = snippet.line && snippet.col ? `#${snippet.line},${snippet.col}` : '';

      /** @type {PhrasingContent[]} */
      const snippetNodes = [];
      const chunks = replaceLessThan(snippet.snippet).split(packageNameMatch);

      for (let i = 0; i < chunks.length; i++) {
        if (chunks[i]) snippetNodes.push(u('text', chunks[i]));
        if (i < chunks.length - 1) snippetNodes.push(u('strong', [u('text', packageName)]));
      }

      if (snippetNodes.length === 0) snippetNodes.push(u('text', snippet.snippet));

      nodes.push(u('break'));
      nodes.push(u('inlineCode', String(snippet.line).padStart(4, '\u00A0')));
      nodes.push(u('text', '\u00A0\u00A0'));
      nodes.push(u('link', { url: `${snippetUri}${snippetPosition}` }, snippetNodes));
    }

    if (snippetsOmittedInFile > 0) {
      nodes.push(u('break'));
      nodes.push(u('text', `…and ${snippetsOmittedInFile} more`));
    }
  }

  return {
    kind: 'markdown',
    value: toMarkdown(u('root', [u('paragraph', nodes)])),
  };
}
