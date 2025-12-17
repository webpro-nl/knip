import { getIssuePrefix } from 'knip/session';
import { DiagnosticSeverity, DiagnosticTag } from 'vscode-languageserver/node.js';

/**
 * @import { Diagnostic } from 'vscode-languageserver';
 * @import { TextDocument } from 'vscode-languageserver-textdocument';
 * @import { Config } from './types.js';
 * @import { Issue, Rules } from 'knip/session';
 */

const SEVERITY = {
  error: DiagnosticSeverity.Error,
  warn: DiagnosticSeverity.Warning,
  off: DiagnosticSeverity.Information,
  hint: DiagnosticSeverity.Hint,
};

/**
 * @param {Issue} issue
 * @param {Rules} rules
 * @param {Config} config
 * @param {TextDocument} [document]
 * @returns {Diagnostic}
 */
export const issueToDiagnostic = (issue, rules, config, document) => {
  if (issue.type === 'files' && document) {
    return {
      severity: DiagnosticSeverity.Information,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 1 },
      },
      message: formatMessage(issue),
      source: 'knip',
      code: issue.type,
    };
  }

  /** @type {DiagnosticSeverity} */
  let severity = SEVERITY[rules[issue.type]];

  /** @type {DiagnosticTag[]} */
  const tags = [];

  if (issue.type === 'exports' && config.editor.exports.highlight.dimExports) {
    severity = DiagnosticSeverity.Hint;
    tags.push(DiagnosticTag.Unnecessary);
  }

  if (issue.type === 'types' && config.editor.exports.highlight.dimTypes) {
    severity = DiagnosticSeverity.Hint;
    tags.push(DiagnosticTag.Unnecessary);
  }

  const line = Math.max(0, (issue.line ?? 1) - 1);
  const start = Math.max(0, (issue.col ?? 0) - 1);
  let len = issue.symbol?.length ?? 1;

  if (issue.symbol === 'default' && (issue.type === 'exports' || issue.type === 'types') && document) {
    const lineText = document.getText({
      start: { line, character: 0 },
      end: { line: line + 1, character: 0 },
    });

    const match = /export\s+default\s+([A-Za-z0-9_$]+)/.exec(lineText);
    if (match) {
      const exportDefaultEnd = match.index + match[0].length;
      len = exportDefaultEnd - start;
    }
  }

  return {
    severity,
    range: {
      start: { line, character: start },
      end: { line, character: start + len },
    },
    message: formatMessage(issue),
    source: 'knip',
    code: issue.type,
    tags: tags.length > 0 ? tags : undefined,
  };
};

/** @param {Issue} issue */
const formatMessage = issue => {
  if (issue.type === 'files') return 'Unused file';
  return getIssueDescription(issue);
};

/** @param {Issue} issue */
const getIssueDescription = ({ type, symbol, symbols, parentSymbol }) => {
  const symbolDescription = symbols ? `${symbols.map(s => s.symbol).join(', ')}` : symbol;
  return `${getIssuePrefix(type)}: ${symbolDescription}${parentSymbol ? ` (${parentSymbol})` : ''}`;
};
