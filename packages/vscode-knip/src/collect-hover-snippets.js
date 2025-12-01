import * as vscode from 'vscode';

/**
 * @import { SourceLocation } from 'knip/session';
 */

/**
 * @typedef {{ line: number; col: number; snippet: string }} HoverSnippet
 * @typedef {(HoverSnippet[] | undefined)[]} HoverSnippets
 */

/**
 * @param {string} identifier
 * @param {SourceLocation[]} locations
 * @param {{ timeout?: number; includeImportLocationSnippet?: boolean }} [options]
 * @returns {Promise<HoverSnippets>}
 */
export async function collectHoverSnippets(identifier, locations, options = {}) {
  const { timeout = 300, includeImportLocationSnippet = false } = options;

  if (!Array.isArray(locations) || locations.length === 0) return [];

  const startTime = Date.now();

  /** @type {HoverSnippets} */
  const snippets = [];
  const seen = new Set();
  const documents = new Map();

  for (const [index, location] of locations.entries()) {
    if (!location?.filePath) continue;

    if (timeout > 0 && Date.now() - startTime > timeout) break;

    try {
      const uri = vscode.Uri.file(location.filePath);
      let document = documents.get(location.filePath);
      if (!document) {
        document = await vscode.workspace.openTextDocument(uri);
        documents.set(location.filePath, document);
      }

      const zeroLine = Math.max((location.line ?? 1) - 1, 0);
      const zeroChar = Math.max((location.col ?? 1) - 1, 0);
      const position = new vscode.Position(zeroLine, zeroChar);

      const highlights = await vscode.commands.executeCommand('vscode.executeDocumentHighlights', uri, position);

      if (!Array.isArray(highlights) || highlights.length === 0) continue;

      snippets[index] ??= [];

      for (const highlight of highlights) {
        if (!highlight?.range) continue;
        if (!includeImportLocationSnippet && highlight.range.contains(position)) continue;

        const line = highlight.range.start.line;
        if (line < 0 || line >= document.lineCount) continue;

        const dedupeKey = `${location.filePath}:${line}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const text = document.lineAt(line).text;
        if (!text.includes(identifier)) continue;

        const char = highlight.range.start.character;
        const start = Math.max(0, char - 30);
        const end = Math.min(text.length, highlight.range.end.character + 30);

        let snippet = text.slice(start, end);
        const trimStart = snippet.length - snippet.trimStart().length;
        const trimEnd = snippet.length - snippet.trimEnd().length;
        snippet = snippet.trim();

        if (start > 0 && trimStart === 0) snippet = `…${snippet}`;
        if (end < text.length && trimEnd === 0) snippet = `${snippet}…`;
        if (snippet.length > 60) snippet = `${snippet.slice(0, 60).trimEnd()}…`;

        snippets[index].push({ line: line + 1, col: char + 1, snippet });
      }
    } catch (_error) {}
  }

  return snippets;
}
