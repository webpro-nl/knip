import picocolors from 'picocolors';
import type { Entries } from 'type-fest';
import type { ConsoleStreamer } from '../ConsoleStreamer.js';
import type { Issues, Report } from '../types/issues.js';
import { perfObserver } from '../util/Performance.js';
import { prettyMilliseconds } from '../util/string.js';
import { getIssueTypeTitle, getTableForType } from './util/util.js';

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

  for (let [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (reportType === 'files') reportType = '_files';

    if (isReportType) {
      const title = reportMultipleGroups && getIssueTypeTitle(reportType);
      const issuesForType = Object.values(issues[reportType]).flatMap(Object.values);

      if (issuesForType.length > 0) {
        if (title) {
          lines.push(`${picocolors.yellowBright(picocolors.underline(title))} (${issuesForType.length})`);
        }
        lines.push(...getTableForType(issuesForType).toRows());
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
