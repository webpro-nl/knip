import { getLine, LineRewriter } from './log.js';
import { relative } from './util/path.js';
import type { Configuration, Counters, Issue } from './types.js';

const lineRewriter = new LineRewriter();

export const getMessageUpdater = (configuration: { isShowProgress: boolean }) => {
  const { isShowProgress } = configuration;
  if (!isShowProgress) return () => {};
  return (message: string) => lineRewriter.update([message]);
};

export const getCountersUpdater = (configuration: Configuration, counters: Counters) => {
  const { isShowProgress, report } = configuration;

  if (!isShowProgress) return () => {};

  return (issue?: Issue) => {
    if (!issue) return lineRewriter.resetLines();

    const { processed, total } = counters;
    const percentage = Math.floor((processed / total) * 100);
    const messages = [getLine(`${percentage}%`, `of files processed (${processed} of ${total})`)];

    report.files && messages.push(getLine(counters.files, 'unused files'));
    report.unlisted && messages.push(getLine(counters.unlisted, 'unlisted dependencies'));
    report.exports && messages.push(getLine(counters.exports, 'unused exports'));
    report.nsExports && messages.push(getLine(counters.nsExports, 'unused exports in namespace'));
    report.types && messages.push(getLine(counters.types, 'unused types'));
    report.nsTypes && messages.push(getLine(counters.nsTypes, 'unused types in namespace'));
    report.enumMembers && messages.push(getLine(counters.enumMembers, 'unused enum members'));
    report.classMembers && messages.push(getLine(counters.classMembers, 'unused class members'));
    report.duplicates && messages.push(getLine(counters.duplicates, 'duplicate exports'));

    if (processed < total) {
      messages.push('');
      messages.push(`Processing: ${relative(issue.filePath)}`);
    }

    lineRewriter.update(messages);
  };
};
