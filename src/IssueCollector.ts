import { initIssues, initCounters } from './issues/initializers.js';
import { relative } from './util/path.js';
import type { ConfigurationHint, Issue, Rules } from './types/issues.js';

type IssueCollectorOptions = {
  cwd: string;
  rules: Rules;
};

/**
 * - Collects issues and counts them
 * - Hands them out, to be consumed by reporters
 */
export class IssueCollector {
  private cwd: string;
  private rules: Rules;
  private issues = initIssues();
  private counters = initCounters();
  private referencedFiles: Set<string> = new Set();
  private configurationHints = new Set();

  constructor({ cwd, rules }: IssueCollectorOptions) {
    this.cwd = cwd;
    this.rules = rules;
  }

  addFileCounts({ processed, unused }: { processed: number; unused: number }) {
    this.counters.processed += processed;
    this.counters.total += processed + unused;
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
    issue.severity = this.rules[issue.type];
    this.issues[issue.type][key] = this.issues[issue.type][key] ?? {};
    if (!this.issues[issue.type][key][issue.symbol]) {
      this.issues[issue.type][key][issue.symbol] = issue;
      this.counters[issue.type]++;
    }
  }

  addConfigurationHint(issue: ConfigurationHint) {
    this.configurationHints.add(issue);
  }

  getIssues() {
    return {
      issues: this.issues,
      counters: this.counters,
      configurationHints: this.configurationHints,
    };
  }
}
