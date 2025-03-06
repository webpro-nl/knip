import { createHash } from 'node:crypto';
import type { Entries } from 'type-fest';
import type { Issue, IssueRecords, IssueSeverity, IssueSymbol, Report, ReporterOptions } from '../types/issues.js';
import { getTitle } from './util.js';

/**
 * Entry for GitLab Code Quality report. See: https://docs.gitlab.com/ci/testing/code_quality/#code-quality-report-format
 */
interface CodeQualityEntry {
  check_name: string;
  description: string;
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker';
  fingerprint: string;
  location: {
    path: string;
    lines: {
      begin: number;
    };
  };
}

export default async ({ report, issues }: ReporterOptions) => {
  const entries: CodeQualityEntry[] = [];
  const hashes = new Set<string>();

  for (const [type, isReportType] of Object.entries(report) as Entries<Report>) {
    if (!isReportType) {
      continue;
    }

    if (type === 'files' || type === '_files') {
      continue;
    }

    for (const issue of flatten(issues[type] as IssueRecords)) {
      const { filePath } = issue;

      if (type === 'duplicates' && issue.symbols) {
        entries.push(
          ...issue.symbols.map(symbol => ({
            check_name: getTitle(type),
            description: getSymbolDescription({ symbol, parentSymbol: issue.parentSymbol }),
            severity: convertSeverity(issue.severity),
            fingerprint: createFingerprint(filePath, symbol.symbol, hashes),
            location: {
              path: filePath,
              lines: {
                begin: symbol.line ?? 0,
              },
            },
          }))
        );
      } else {
        entries.push({
          check_name: getTitle(type),
          description: getIssueDescription(issue),
          severity: convertSeverity(issue.severity),
          fingerprint: createFingerprint(filePath, issue.symbol, hashes),
          location: {
            path: filePath,
            lines: {
              begin: issue.line ?? 0,
            },
          },
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

function convertSeverity(severity?: IssueSeverity): CodeQualityEntry['severity'] {
  switch (severity) {
    case undefined:
      return 'info';

    case 'error':
      return 'major';

    case 'warn':
      return 'minor';

    case 'off':
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

function createFingerprint(filePath: string, message: string, hashes: Set<string>): string {
  const md5 = createHash('md5');

  md5.update(filePath);
  md5.update(message);

  let md5Copy = md5.copy();
  let hash = md5Copy.digest('hex');

  // To avoid hash collision, we keep generating new hashes until we get a unique one.
  while (hashes.has(hash)) {
    md5.update(hash);

    md5Copy = md5.copy();
    hash = md5Copy.digest('hex');
  }

  hashes.add(hash);

  return hash;
}
