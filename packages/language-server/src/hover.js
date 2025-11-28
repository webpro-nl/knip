import { relative } from 'node:path/posix';
import { pathToFileURL } from 'node:url';
import { toMarkdown } from 'mdast-util-to-markdown';
import { u } from 'unist-builder';

/**
 * @typedef {import('mdast').List} List
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('./types.js').HoverSnippets} HoverSnippets
 * @typedef {import('vscode-languageserver').Hover} Hover
 */

/** @param {string} text */
const replaceLessThan = text => text.replace(lessThanMatch, '‹');
const lessThanMatch = /</g;

/**
 * @param {{
 *   identifier: string;
 *   root: string;
 *   locations: import('knip/session').ImportLocation[];
 *   snippets: HoverSnippets;
 *   maxSnippets: number;
 * }} options
 * @returns {Hover}
 */
export const getImportedByHoverContent = options => {
  const { identifier, snippets, maxSnippets } = options;
  const refs = options.locations.length;
  const identifierMatch = new RegExp(`\\b${identifier}\\b`, 'g');
  const _root = `${options.root}/`;

  /** @type {PhrasingContent[]} */
  const nodes = [
    u('text', `${refs} file${refs > 1 ? 's' : ''} import${refs > 1 ? '' : 's'} `),
    u('strong', [u('text', identifier)]),
  ];

  for (let index = 0; index < options.locations.length; index++) {
    const loc = options.locations[index];
    const uri = pathToFileURL(loc.filePath).toString();
    const position = loc.line && loc.col ? `#${loc.line},${loc.col}` : loc.line ? `#${loc.line}` : '';
    const relativePath = loc.filePath.replace(_root, '');

    nodes.push(u('break'));
    nodes.push(u('link', { url: `${uri}${position}` }, [u('text', relativePath)]));

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
    contents: {
      kind: 'markdown',
      value: toMarkdown(u('root', [u('paragraph', nodes)])),
    },
  };
};

/**
 * @param {string} identifier
 * @param {string} root
 * @param {Set<string>} entryPaths
 * @param {string} filePath
 * @returns {Hover}
 */
export const getEntryPathsHoverContent = (identifier, root, entryPaths, filePath) => {
  const isEntryFile = entryPaths.size === 1 && entryPaths.has(filePath);

  /** @type {(Paragraph | List)[]} */
  const rootNode = [
    u('paragraph', [
      u('text', `No files import `),
      u('strong', [u('text', identifier)]),
      u(
        'text',
        isEntryFile
          ? '; exported by entry file'
          : `; re-exported by ${entryPaths.size} entry file${entryPaths.size > 1 ? 's' : ''}:`
      ),
    ]),
  ];

  if (!isEntryFile) {
    const nodes = Array.from(entryPaths, entryPath => {
      const url = pathToFileURL(entryPath).toString();
      const text = relative(root, entryPath);
      return u('listItem', { spread: false }, [u('paragraph', [u('link', { url }, [u('text', text)])])]);
    });

    rootNode.push(u('list', { ordered: false, spread: false }, nodes));
  }

  return {
    contents: {
      kind: 'markdown',
      value: toMarkdown(u('root', rootNode)),
    },
  };
};
