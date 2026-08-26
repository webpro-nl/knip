import { getIssuePrefix } from 'knip/session';
import { DiagnosticSeverity, DiagnosticTag } from 'vscode-languageserver/node';

/**
 * @import { Diagnostic } from 'vscode-languageserver';
 * @import { TextDocument } from 'vscode-languageserver-textdocument';
 * @import { Config } from './types.js';
 * @import { Issue, IssueType, Rules } from 'knip/session';
 */

/** Superseded by `editor.severity`; kept until the settings are removed */
const dimmedIssueTypes = {
  exports: 'dimExports',
  types: 'dimTypes',
  enumMembers: 'dimEnumMembers',
  duplicates: 'dimDuplicates',
};

const SEVERITY = {
  error: DiagnosticSeverity.Error,
  warn: DiagnosticSeverity.Warning,
  off: DiagnosticSeverity.Information,
  hint: DiagnosticSeverity.Hint,
};

const ABSOLUTE_SEVERITY = {
  error: DiagnosticSeverity.Error,
  warning: DiagnosticSeverity.Warning,
  information: DiagnosticSeverity.Information,
  hint: DiagnosticSeverity.Hint,
};

/** Loudest to quietest, so `downgrade` and `upgrade` can step along it */
const SEVERITY_ORDER = [
  DiagnosticSeverity.Error,
  DiagnosticSeverity.Warning,
  DiagnosticSeverity.Information,
  DiagnosticSeverity.Hint,
];

/**
 * @param {DiagnosticSeverity} severity
 * @param {number} steps
 * @returns {DiagnosticSeverity}
 */
const step = (severity, steps) => {
  const index = SEVERITY_ORDER.indexOf(severity);
  if (index === -1) return severity;
  return SEVERITY_ORDER[Math.min(SEVERITY_ORDER.length - 1, Math.max(0, index + steps))];
};

/**
 * Editor-only: `rules` decides what fails a run, this decides how the editor renders it.
 * Most specific wins — the issue type, then a dim setting, then `*`, then `rules`.
 * @param {IssueType} type
 * @param {DiagnosticSeverity} base severity `rules` would give this issue type
 * @param {Config} config
 * @returns {DiagnosticSeverity}
 */
const resolveSeverity = (type, base, config) => {
  const configured = config.editor.severity;
  const isScalar = typeof configured === 'string';

  const dimSetting = dimmedIssueTypes[type];
  const isDimmed = dimSetting ? config.editor.exports.highlight[dimSetting] === true : false;

  const value =
    (isScalar ? undefined : configured?.[type]) ??
    (isDimmed ? 'hint' : undefined) ??
    (isScalar ? configured : configured?.['*']);

  if (value === 'downgrade') return step(base, 1);
  if (value === 'upgrade') return step(base, -1);
  return ABSOLUTE_SEVERITY[value] ?? base;
};

/**
 * @param {Issue} issue
 * @param {Rules} rules
 * @param {Config} config
 * @param {TextDocument} [document]
 * @returns {Diagnostic}
 */
export const issueToDiagnostic = (issue, rules, config, document) => {
  // unused files are informational by default: the whole file is the finding, not a symbol in it
  const base = issue.type === 'files' ? DiagnosticSeverity.Information : SEVERITY[rules[issue.type]];
  const severity = resolveSeverity(issue.type, base, config);

  if (issue.type === 'files' && document) {
    return {
      severity,
      tags: severity === DiagnosticSeverity.Hint ? [DiagnosticTag.Unnecessary] : undefined,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 1 },
      },
      message: formatMessage(issue),
      source: 'knip',
      code: issue.type,
    };
  }

  // a hint is nearly invisible without it, and this is what makes `hint` fade the code
  const tags = severity === DiagnosticSeverity.Hint ? [DiagnosticTag.Unnecessary] : [];

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
