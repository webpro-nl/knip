import picocolors from 'picocolors';
import prettyMilliseconds from 'pretty-ms';
import type { Entries } from 'type-fest';
import type { ConsoleStreamer } from '../ConsoleStreamer.js';
import type { IssueSet, Issues, Report } from '../types/issues.js';
import { perfObserver } from '../util/Performance.js';
import { relative } from '../util/path.js';
import { getTitle } from './util.js';

interface WatchReporter {
  report: Report;
  issues: Issues;
  streamer: ConsoleStreamer;
  startTime?: number;
  size: number;
  isDebug: boolean;
}

export default ({ report, issues, streamer, startTime, size, isDebug }: WatchReporter) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  let totalIssues = 0;
  const lines: string[] = [];
  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (reportType === '_files') continue;

    if (isReportType) {
      const title = reportMultipleGroups && getTitle(reportType);
      const isSet = issues[reportType] instanceof Set;
      const issuesForType = isSet
        ? Array.from(issues[reportType] as IssueSet)
        : Object.values(issues[reportType]).flatMap(Object.values);

      if (issuesForType.length > 0) {
        if (title) {
          lines.push(`${picocolors.yellowBright(picocolors.underline(title))} (${issuesForType.length})`);
        }
        if (typeof issuesForType[0] === 'string') {
          lines.push(...issuesForType.map(filePath => relative(filePath)));
        } else {
          const width = issuesForType.reduce((max, issue) => Math.max(max, issue.symbol.length), 0) + 1;
          for (const issue of issuesForType) {
            const filePath = relative(issue.filePath);
            const pos = issue.line ? `:${issue.line}:${issue.col}` : '';
            lines.push(`${issue.symbol.padEnd(width)} ${filePath}${pos}`);
          }
        }
      }

      totalIssues = totalIssues + issuesForType.length;
    }
  }

  const mem = perfObserver.getCurrentMemUsageInMb();
  const duration = perfObserver.getCurrentDurationInMs(startTime);
  const summary = `${size} files in ${prettyMilliseconds(duration)} (${mem}MB)`;

  const messages =
    totalIssues === 0
      ? ['✂️  Excellent, Knip found no issues.', '', picocolors.gray(summary)]
      : [...lines, '', picocolors.gray(summary)];

  if (isDebug) console.log(messages.join('\n'));
  else streamer.cast(messages);
};
