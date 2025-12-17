import { relative } from 'node:path/posix';
import { pathToFileURL } from 'node:url';
import { toMarkdown } from 'mdast-util-to-markdown';
import { u } from 'unist-builder';

/**
 * @typedef {import('mdast').List} List
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('./collect-hover-snippets.js').HoverSnippets} HoverSnippets
 * @import { Export } from 'knip/session';
 */

/** @param {string} text */
const replaceLessThan = text => text.replace(lessThanMatch, '‹');
const lessThanMatch = /</g;

/**
 * @param {Export} _export
 * @param {string} root
 * @param {HoverSnippets} snippets
 * @param {number} maxSnippets
 * @returns {{ kind: 'markdown'; value: string }}
 */
export function renderExportHover(_export, root, snippets, maxSnippets) {
  const { identifier, importLocations } = _export;
  const uniqueFiles = new Set(importLocations.map(loc => loc.filePath));
  const refs = uniqueFiles.size;
  const identifierMatch = new RegExp(`\\b${identifier}\\b`, 'g');
  const _root = `${root}/`;

  /** @type {PhrasingContent[]} */
  const nodes = [
    u('text', `${refs} file${refs > 1 ? 's' : ''} import${refs > 1 ? '' : 's'} `),
    u('strong', [u('text', identifier)]),
  ];

  let lastFilePath = '';

  for (let index = 0; index < importLocations.length; index++) {
    const loc = importLocations[index];
    const uri = pathToFileURL(loc.filePath).toString();
    const position = loc.line && loc.col ? `#${loc.line},${loc.col}` : loc.line ? `#${loc.line}` : '';
    const relativePath = loc.filePath.replace(_root, '');

    if (loc.filePath !== lastFilePath) {
      nodes.push(u('break'));
      nodes.push(u('link', { url: `${uri}${position}` }, [u('text', relativePath)]));
      lastFilePath = loc.filePath;
    }

    const snippetsForFile = snippets[index] ?? [];
    const limitedSnippets = maxSnippets < 0 ? snippetsForFile : snippetsForFile.slice(0, maxSnippets);
    if (limitedSnippets.length > 0) {
      for (const snippet of limitedSnippets) {
        if (!snippet.snippet.includes(identifier)) continue;
        const snippetUri = pathToFileURL(loc.filePath).toString();
        const _snippet = replaceLessThan(snippet.snippet);

        const importNode = [];
        const chunks = _snippet.split(identifierMatch);

        for (let i = 0; i < chunks.length; i++) {
          if (chunks[i]) importNode.push(u('text', chunks[i]));
          if (i < chunks.length - 1) importNode.push(u('strong', [u('text', identifier)]));
        }

        if (importNode.length === 0) importNode.push(u('text', _snippet));

        nodes.push(u('break'));
        nodes.push(u('inlineCode', String(snippet.line).padStart(4, '\u00A0')));
        nodes.push(u('text', '\u00A0\u00A0'));
        nodes.push(u('link', { url: `${snippetUri}#${snippet.line},${snippet.col}` }, importNode));
      }

      if (maxSnippets > 0 && snippetsForFile.length > maxSnippets) {
        const remaining = snippetsForFile.length - maxSnippets;
        nodes.push(u('break'));
        nodes.push(u('text', `…and ${remaining} more`));
      }
    }
  }

  return {
    kind: 'markdown',
    value: toMarkdown(u('root', [u('paragraph', nodes)])),
  };
}

/**
 * @param {Export} _export
 * @param {string} filePath
 * @param {string} root
 * @returns {{ kind: 'markdown'; value: string }}
 */
export function renderExportHoverEntryPaths(_export, filePath, root) {
  const { identifier, entryPaths } = _export;
  const entryPathsArray = Array.from(entryPaths);
  const isEntryFile = entryPathsArray.length === 1 && entryPathsArray[0] === filePath;

  /** @type {(Paragraph | List)[]} */
  const rootNode = [
    u('paragraph', [
      u('text', `No files import `),
      u('strong', [u('text', identifier)]),
      u(
        'text',
        isEntryFile
          ? '; exported by entry file'
          : `; re-exported by ${entryPathsArray.length} entry file${entryPathsArray.length > 1 ? 's' : ''}:`
      ),
    ]),
  ];

  if (!isEntryFile) {
    const nodes = entryPathsArray.map(entryPath => {
      const url = pathToFileURL(entryPath).toString();
      const text = relative(root, entryPath);
      return u('listItem', { spread: false }, [u('paragraph', [u('link', { url }, [u('text', text)])])]);
    });

    rootNode.push(u('list', { ordered: false, spread: false }, nodes));
  }

  return {
    kind: 'markdown',
    value: toMarkdown(u('root', rootNode)),
  };
}
