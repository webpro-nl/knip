import { createHash } from 'node:crypto';
import type * as codeclimate from 'codeclimate-types';
import { ISSUE_TYPE_TITLE } from '../constants.js';
import type { Entries } from '../types/entries.js';
import type {
  Issue,
  IssueRecords,
  IssueSeverity,
  IssueSymbol,
  Report,
  ReporterOptions,
  SymbolIssueType,
} from '../types/issues.js';
import { toRelative } from '../util/path.js';
import { getIssueTypeTitle } from './util/util.js';

export default async ({ report, issues, cwd }: ReporterOptions) => {
  const entries: codeclimate.Issue[] = [];

  for (const [type, isReportType] of Object.entries(report) as Entries<Report>) {
    if (!isReportType) {
      continue;
    }

    const fixedType = type === 'files' ? '_files' : type;

    for (const issue of flatten(issues[fixedType])) {
      const { filePath } = issue;

      if (fixedType === 'duplicates' && issue.symbols) {
        entries.push(
          ...issue.symbols.map<codeclimate.Issue>(symbol => ({
            type: 'issue',
            check_name: getIssueTypeTitle(fixedType),
            description: getSymbolDescription({ type: issue.type, symbol, parentSymbol: issue.parentSymbol }),
            categories: ['Duplication'],
            location: createLocation(filePath, cwd, symbol.line, symbol.col),
            severity: convertSeverity(issue.severity),
            fingerprint: createFingerprint(filePath, cwd, symbol.symbol),
          }))
        );
      } else {
        entries.push({
          type: 'issue',
          check_name: getIssueTypeTitle(fixedType),
          description: getIssueDescription(issue),
          categories: ['Bug Risk'],
          location: createLocation(filePath, cwd, issue.line, issue.col),
          severity: convertSeverity(issue.severity),
          fingerprint: createFingerprint(filePath, cwd, issue.symbol),
        });
      }
    }
  }

  const output = JSON.stringify(entries);

  // See: https://github.com/nodejs/node/issues/6379
  // @ts-expect-error _handle is private
  process.stdout._handle?.setBlocking?.(true);
  process.stdout.write(`${output}\n`);
};

function flatten(issues: IssueRecords): Issue[] {
  return Object.values(issues).flatMap(Object.values);
}

function convertSeverity(severity?: IssueSeverity): codeclimate.Severity {
  switch (severity) {
    case 'error':
      return 'major';
    case 'warn':
      return 'minor';
    default:
      return 'info';
  }
}

function getPrefix(type: SymbolIssueType) {
  return ISSUE_TYPE_TITLE[type].replace(/ies$/, 'y').replace(/s$/, '');
}

function getIssueDescription({ type, symbol, symbols, parentSymbol }: Issue) {
  const symbolDescription = symbols ? `${symbols.map(s => s.symbol).join(', ')}` : symbol;
  return `${getPrefix(type)}: ${symbolDescription}${parentSymbol ? ` (${parentSymbol})` : ''}`;
}

function getSymbolDescription({
  type,
  symbol,
  parentSymbol,
}: { type: SymbolIssueType; symbol: IssueSymbol; parentSymbol?: string }) {
  return `${getPrefix(type)}: ${symbol.symbol}${parentSymbol ? ` (${parentSymbol})` : ''}`;
}

function createLocation(filePath: string, cwd: string, line?: number, col?: number): codeclimate.Location {
  if (col !== undefined) {
    return {
      path: toRelative(filePath, cwd),
      positions: {
        begin: {
          line: line ?? 0,
          column: col,
        },
        end: {
          line: line ?? 0,
          column: col,
        },
      },
    };
  }

  return {
    path: toRelative(filePath, cwd),
    lines: {
      begin: line ?? 0,
      end: line ?? 0,
    },
  };
}

function createFingerprint(filePath: string, cwd: string, message: string): string {
  const md5 = createHash('md5');

  md5.update(toRelative(filePath, cwd));
  md5.update(message);

  return md5.digest('hex');
}
