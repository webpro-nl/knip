import { initIssues, initCounters } from './issues/initializers.js';
import { relative } from './util/path.js';
import type { Issue } from './types/issues.js';

type IssueCollectorOptions = {
  cwd: string;
};

/**
 * - Collects issues and counts them
 * - Hands them out, to be consumed by reporters
 */
export class IssueCollector {
  cwd: string;
  issues = initIssues();
  counters = initCounters();
  pluginEntryFile: Set<string> = new Set();
  referencedFiles: Set<string> = new Set();

  constructor({ cwd }: IssueCollectorOptions) {
    this.cwd = cwd;
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

  getIssues() {
    return {
      issues: this.issues,
      counters: this.counters,
    };
  }
}
