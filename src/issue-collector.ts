import path from 'node:path';
import { initReport, initIssues, initCounters } from './issues/initializers.js';
import { getLine, LineRewriter } from './util/log.js';
import { relative } from './util/path.js';
import type { Issue, Report } from './types/issues.js';

type IssueCollectorOptions = {
  cwd: string;
  isShowProgress?: boolean;
  report?: Report;
};

/**
 * - Collects issues
 * - Updates progress/stats in console during the process
 */
export default class IssueCollector {
  report;
  issues;
  counters;
  lineRewriter: LineRewriter;

  pluginEntryFile: Set<string>;

  referencedFiles: Set<string>;

  cwd: string;
  isShowProgress = false;

  constructor({ cwd, isShowProgress = false, report }: IssueCollectorOptions) {
    this.lineRewriter = new LineRewriter();
    this.cwd = cwd;

    this.setIsShowProgress(isShowProgress);

    this.report = report ?? initReport();
    this.issues = initIssues();
    this.counters = initCounters();

    this.pluginEntryFile = new Set();

    this.referencedFiles = new Set();
  }

  setIsShowProgress(isShowProgress: boolean) {
    this.isShowProgress = isShowProgress;
  }

  setProjectFilesCount(count: number) {
    this.counters.total = count;
  }

  addFilesIssues(filePaths: Set<string>) {
    filePaths.forEach(filePath => {
      if (!this.referencedFiles.has(filePath)) {
        this.issues.files.add(filePath);
        this.counters.files++;
        this.counters.processed++;
      }
    });
  }

  addIssue(issue: Issue) {
    issue.filePath = path.relative(this.cwd, issue.filePath);
    const key = relative(issue.filePath);
    this.issues[issue.type][key] = this.issues[issue.type][key] ?? {};
    if (!this.issues[issue.type][key][issue.symbol]) {
      this.issues[issue.type][key][issue.symbol] = issue;
      this.counters[issue.type]++;
      this.updateProgress(issue);
    }
  }

  setReport(report: Report) {
    this.report = report;
  }

  updateMessage(message: string) {
    if (!this.isShowProgress) return;
    this.lineRewriter.update([message]);
  }

  updateProgress(issue?: Issue) {
    if (!this.isShowProgress) return;

    const { processed, total } = this.counters;
    const percentage = total === 0 ? 0 : Math.floor((processed / total) * 100);
    const messages = [getLine(`${percentage}%`, `of files processed (${processed} of ${total})`)];

    this.report.files && messages.push(getLine(this.counters.files, 'unused files'));
    this.report.unlisted && messages.push(getLine(this.counters.unlisted, 'unlisted dependencies'));
    this.report.exports && messages.push(getLine(this.counters.exports, 'unused exports'));
    this.report.nsExports && messages.push(getLine(this.counters.nsExports, 'unused exports in namespace'));
    this.report.types && messages.push(getLine(this.counters.types, 'unused types'));
    this.report.nsTypes && messages.push(getLine(this.counters.nsTypes, 'unused types in namespace'));
    this.report.enumMembers && messages.push(getLine(this.counters.enumMembers, 'unused enum members'));
    this.report.classMembers && messages.push(getLine(this.counters.classMembers, 'unused class members'));
    this.report.duplicates && messages.push(getLine(this.counters.duplicates, 'duplicate exports'));

    if (issue && processed < total) {
      messages.push('');
      messages.push(`Processing: ${relative(issue.filePath)}`);
    }

    this.lineRewriter.update(messages);
  }

  removeProgress() {
    if (!this.isShowProgress) return;
    this.lineRewriter.resetLines();
  }

  getIssues() {
    return {
      report: this.report,
      issues: this.issues,
      counters: this.counters,
    };
  }
}
