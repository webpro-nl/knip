import { createHash } from 'node:crypto';
import type * as codeclimate from 'codeclimate-types';
import type { Entries } from 'type-fest';
import type { Issue, IssueRecords, IssueSeverity, IssueSymbol, Report, ReporterOptions } from '../types/issues.js';
import { toRelative } from '../util/path.js';
import { getTitle } from './util.js';

export default async ({ report, issues }: ReporterOptions) => {
  const entries: codeclimate.Issue[] = [];
  const hashes = new Set<string>();

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
            check_name: getTitle(fixedType),
            description: getSymbolDescription({ symbol, parentSymbol: issue.parentSymbol }),
            categories: ['Duplication'],
            location: createLocation(filePath, symbol.line, symbol.col),
            severity: convertSeverity(issue.severity),
            fingerprint: createFingerprint(filePath, symbol.symbol, hashes),
          }))
        );
      } else {
        entries.push({
          type: 'issue',
          check_name: getTitle(fixedType),
          description: getIssueDescription(issue),
          categories: ['Bug Risk'],
          location: createLocation(filePath, issue.line, issue.col),
          severity: convertSeverity(issue.severity),
          fingerprint: createFingerprint(filePath, issue.symbol, hashes),
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

function getIssueDescription({ symbol, symbols, parentSymbol }: Issue) {
  const symbolDescription = symbols ? `${symbols.map(s => s.symbol).join(', ')}` : symbol;

  return `${symbolDescription}${parentSymbol ? ` (${parentSymbol})` : ''}`;
}

function getSymbolDescription({ symbol, parentSymbol }: { symbol: IssueSymbol; parentSymbol?: string }) {
  return `${symbol.symbol}${parentSymbol ? ` (${parentSymbol})` : ''}`;
}

function createLocation(filePath: string, line?: number, col?: number): codeclimate.Location {
  if (col !== undefined) {
    return {
      path: toRelative(filePath),
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
    path: toRelative(filePath),
    lines: {
      begin: line ?? 0,
      end: line ?? 0,
    },
  };
}

function createFingerprint(filePath: string, message: string, hashes: Set<string>): string {
  const md5 = createHash('md5');

  md5.update(toRelative(filePath));
  md5.update(message);

  // Create copy of hash since md5.digest() will finalize it, not allowing us to .update() again
  let md5Tmp = md5.copy();
  let hash = md5Tmp.digest('hex');

  while (hashes.has(hash)) {
    // Hash collision. This happens if we encounter the same ESLint message in one file
    // multiple times. Keep generating new hashes until we get a unique one.
    md5.update(hash);

    md5Tmp = md5.copy();
    hash = md5Tmp.digest('hex');
  }

  hashes.add(hash);

  return md5.digest('hex');
}
