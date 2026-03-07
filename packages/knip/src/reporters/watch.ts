import picocolors from 'picocolors';
import type { ConsoleStreamer } from '../ConsoleStreamer.ts';
import type { Entries } from '../types/entries.ts';
import type { Issues } from '../types/issues.ts';
import type { MainOptions } from '../util/create-options.ts';
import { perfObserver } from '../util/Performance.ts';
import { prettyMilliseconds } from '../util/string.ts';
import { getIssueTypeTitle, getTableForType } from './util/util.ts';

interface WatchReporter {
  issues: Issues;
  streamer: ConsoleStreamer;
  duration?: number;
  size: number;
}

export default (options: MainOptions, { issues, streamer, duration, size }: WatchReporter) => {
  const reportMultipleGroups = Object.values(options.includedIssueTypes).filter(Boolean).length > 1;
  let totalIssues = 0;
  const lines: string[] = [];

  for (let [reportType, isReportType] of Object.entries(options.includedIssueTypes) as Entries<
    typeof options.includedIssueTypes
  >) {
    if (reportType === 'files') reportType = '_files';

    if (isReportType) {
      const title = reportMultipleGroups && getIssueTypeTitle(reportType);
      const issuesForType = Object.values(issues[reportType]).flatMap(Object.values);

      if (issuesForType.length > 0) {
        if (title) {
          lines.push(`${picocolors.yellowBright(picocolors.underline(title))} (${issuesForType.length})`);
        }
        lines.push(...getTableForType(issuesForType, options.cwd).toRows());
      }

      totalIssues = totalIssues + issuesForType.length;
    }
  }

  const mem = perfObserver.getCurrentMemUsageInMb();
  const ms = duration ?? perfObserver.getCurrentDurationInMs();
  const summary = `${size} files (${prettyMilliseconds(ms)} • ${mem}MB)`;

  const messages =
    totalIssues === 0
      ? ['✂️  Excellent, Knip found no issues.', '', picocolors.gray(summary)]
      : [...lines, '', picocolors.gray(summary)];

  if (options.isDebug) console.log(messages.join('\n'));
  else streamer.cast(messages);
};
