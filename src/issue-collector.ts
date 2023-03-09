import { initReport, initIssues, initCounters } from './issues/initializers.js';
import { LineRewriter } from './util/log.js';
import { relative } from './util/path.js';
import type { Issue, Report } from './types/issues.js';

type IssueCollectorOptions = {
  cwd: string;
  report?: Report;
};

/**
 * - Collects issues and counts them
 * - Hands them out, to be consumed by reporters
 */
export class IssueCollector {
  report;
  issues;
  counters;
  lineRewriter: LineRewriter;

  pluginEntryFile: Set<string>;

  referencedFiles: Set<string>;

  cwd: string;

  constructor({ cwd, report }: IssueCollectorOptions) {
    this.lineRewriter = new LineRewriter();
    this.cwd = cwd;

    this.report = report ?? initReport();
    this.issues = initIssues();
    this.counters = initCounters();

    this.pluginEntryFile = new Set();

    this.referencedFiles = new Set();
  }

  setTotalFileCount(count: number) {
    this.counters.total = count;
  }

  addFilesIssues(filePaths: string[]) {
    filePaths.forEach(filePath => {
      if (!this.referencedFiles.has(filePath)) {
        this.issues.files.add(filePath);
        this.counters.files++;
        this.counters.processed++;
      }
    });
  }

  addIssue(issue: Issue) {
    const key = relative(this.cwd, issue.filePath);
    this.issues[issue.type][key] = this.issues[issue.type][key] ?? {};
    if (!this.issues[issue.type][key][issue.symbol]) {
      this.issues[issue.type][key][issue.symbol] = issue;
      this.counters[issue.type]++;
    }
  }

  setReport(report: Report) {
    this.report = report;
  }

  getIssues() {
    return {
      report: this.report,
      issues: this.issues,
      counters: this.counters,
    };
  }
}
