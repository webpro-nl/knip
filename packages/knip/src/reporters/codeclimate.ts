import { createHash } from 'node:crypto';
import type { Entries } from 'type-fest';
import type { Issue, IssueRecords, IssueSeverity, IssueSymbol, Report, ReporterOptions } from '../types/issues.js';
import { toRelative } from '../util/path.js';
import { getTitle } from './util.js';

type CodeClimateSeverity = 'info' | 'minor' | 'major' | 'critical' | 'blocker';

interface CodeClimateEntry {
  type: 'issue';
  check_name: string;
  description: string;
  categories: string[];
  location: {
    path: string;
    positions: {
      begin: {
        line: number;
        column: number;
      };
    };
  };
  severity: CodeClimateSeverity;
  fingerprint: string;
}

export default async ({ report, issues }: ReporterOptions) => {
  const entries: CodeClimateEntry[] = [];

  for (const [type, isReportType] of Object.entries(report) as Entries<Report>) {
    if (!isReportType) {
      continue;
    }

    const fixedType = type === 'files' ? '_files' : type;

    for (const issue of flatten(issues[fixedType] as IssueRecords)) {
      const { filePath } = issue;

      if (fixedType === 'duplicates' && issue.symbols) {
        entries.push(
          ...issue.symbols.map(symbol => ({
            type: 'issue' as const,
            check_name: getTitle(fixedType),
            description: getSymbolDescription({ symbol, parentSymbol: issue.parentSymbol }),
            categories: ['Duplication'],
            location: {
              path: toRelative(filePath),
              positions: {
                begin: {
                  line: symbol.line ?? 0,
                  column: symbol.col ?? 0,
                },
              },
            },
            severity: convertSeverity(issue.severity),
            fingerprint: createFingerprint(filePath, symbol.symbol, symbol.pos),
          }))
        );
      } else {
        entries.push({
          type: 'issue' as const,
          check_name: getTitle(fixedType),
          description: getIssueDescription(issue),
          categories: ['Bug Risk'],
          location: {
            path: toRelative(filePath),
            positions: {
              begin: {
                line: issue.line ?? 0,
                column: issue.col ?? 0,
              },
            },
          },
          severity: convertSeverity(issue.severity),
          fingerprint: createFingerprint(filePath, issue.symbol, issue.pos),
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

function convertSeverity(severity?: IssueSeverity): CodeClimateSeverity {
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

function createFingerprint(filePath: string, message: string, pos?: number): string {
  const md5 = createHash('md5');

  md5.update(filePath);
  md5.update(message);
  md5.update(pos?.toString() ?? '');

  return md5.digest('hex');
}
