import { DeleteFile, TextEdit } from 'vscode-languageserver/node.js';

/**
 * @import { WorkspaceEdit } from 'vscode-languageserver';
 * @import { TextDocument } from 'vscode-languageserver-textdocument';
 * @import { Issue } from 'knip/session';
 */

/**
 * @param {TextDocument | undefined} document
 * @param {string} uri
 * @param {Issue} issue
 * @returns {WorkspaceEdit | null}
 */
export const createRemoveExportEdit = (document, uri, issue) => {
  try {
    if (!document || !issue.fixes?.length) return null;

    const edits = issue.fixes.map(([start, end]) => {
      return TextEdit.del({ start: document.positionAt(start), end: document.positionAt(end) });
    });

    return { changes: { [uri]: edits } };
  } catch (_error) {
    return null;
  }
};

/**
 * @param {TextDocument | undefined} document
 * @param {string} uri
 * @param {Issue} issue
 * @returns {WorkspaceEdit | null}
 */
export const createRemoveDependencyEdit = (document, uri, issue) => {
  try {
    if (!document || issue.line === undefined) return null;

    const lineIndex = issue.line - 1;
    const range = { start: { line: lineIndex, character: 0 }, end: { line: lineIndex + 1, character: 0 } };
    const edits = [TextEdit.del(range)];

    return { changes: { [uri]: edits } };
  } catch (_error) {
    return null;
  }
};

/**
 * @param {string} uri
 * @returns {WorkspaceEdit | null}
 */
export const createDeleteFileEdit = uri => {
  try {
    return {
      documentChanges: [DeleteFile.create(uri, { recursive: false, ignoreIfNotExists: true })],
    };
  } catch (_error) {
    return null;
  }
};

/**
 *
 * @param {TextDocument} document
 * @param {Issue} issue
 * @param {string} tag
 */
export function createAddJSDocTagEdit(document, issue, tag) {
  try {
    if (!document || issue.line === undefined) return null;

    const lineIndex = issue.line - 1;
    const lineText = document.getText({
      start: { line: lineIndex, character: 0 },
      end: { line: lineIndex + 1, character: 0 },
    });
    const indent = lineText.match(/^\s*/)?.[0] || '';

    if (lineIndex > 0) {
      const prevLineText = document.getText({
        start: { line: lineIndex - 1, character: 0 },
        end: { line: lineIndex, character: 0 },
      });
      const trimmedPrev = prevLineText.trim();

      if (trimmedPrev.startsWith('/**') && trimmedPrev.endsWith('*/')) {
        const content = trimmedPrev.slice(3, -2).trim();
        const range = {
          start: { line: lineIndex - 1, character: 0 },
          end: { line: lineIndex - 1, character: prevLineText.length },
        };

        let multilineJSDoc = `${indent}/**\n${indent} * ${tag}`;
        if (content) {
          multilineJSDoc += `\n${indent} * ${content}`;
        }
        multilineJSDoc += `\n${indent} */`;

        return [TextEdit.replace(range, multilineJSDoc)];
      }

      if (trimmedPrev.endsWith('*/')) {
        for (let i = lineIndex - 2; i >= 0; i--) {
          const text = document.getText({ start: { line: i, character: 0 }, end: { line: i + 1, character: 0 } });
          if (text.trim().startsWith('/**')) {
            const insertPosition = { line: i, character: text.trimEnd().length };
            const tagLine = `\n${indent} * ${tag}`;
            return [TextEdit.insert(insertPosition, tagLine)];
          }
        }
      }
    }

    const jsdocComment = `${indent}/** ${tag} */\n`;
    const insertPosition = { line: lineIndex, character: 0 };
    return [TextEdit.insert(insertPosition, jsdocComment)];
  } catch (_error) {
    return null;
  }
}
