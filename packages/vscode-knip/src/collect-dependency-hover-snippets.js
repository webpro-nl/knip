import * as vscode from 'vscode';

/**
 * @param {import('knip/session').DependencyNode[]} imports
 * @returns {Promise<import('./render-dependency-hover.js').DependencySnippet[]>}
 */
export async function collectDependencySnippets(imports) {
  /** @type {import('./render-dependency-hover.js').DependencySnippet[]} */
  const snippets = [];
  /** @type {Map<string, vscode.TextDocument>} */
  const documents = new Map();
  const seen = new Set();

  for (const _import of imports) {
    if (!_import.filePath) continue;

    const dedupeKey = _import.line === undefined ? `${_import.filePath}:ref` : _import.filePath;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    if (_import.line === undefined) {
      snippets.push({ filePath: _import.filePath, line: undefined, col: undefined, snippet: undefined });
      continue;
    }

    try {
      const uri = vscode.Uri.file(_import.filePath);
      let doc = documents.get(_import.filePath);
      if (!doc) {
        doc = await vscode.workspace.openTextDocument(uri);
        documents.set(_import.filePath, doc);
      }

      const lineIndex = _import.line - 1;
      if (lineIndex < 0 || lineIndex >= doc.lineCount) continue;

      const text = doc.lineAt(lineIndex).text.trim();
      snippets.push({ filePath: _import.filePath, line: _import.line, col: _import.col, snippet: text });
    } catch {}
  }

  return snippets;
}
