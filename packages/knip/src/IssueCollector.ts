import picomatch from 'picomatch';
import { initCounters, initIssues } from './issues/initializers.js';
import type { ConfigurationHint, Issue, Rules, TagHint } from './types/issues.js';
import { timerify } from './util/Performance.js';
import { relative } from './util/path.js';

type Filters = Partial<{
  dir: string;
}>;

type IssueCollectorOptions = {
  cwd: string;
  rules: Rules;
  filters: Filters;
};

const hasConfigurationHint = (hints: Set<ConfigurationHint>, hint: ConfigurationHint) =>
  Array.from(hints).some(
    item => item.identifier === hint.identifier && item.type === hint.type && item.workspaceName === hint.workspaceName
  );

const isMatch = timerify(picomatch.isMatch, 'isMatch');

/**
 * - Collects issues and counts them
 * - Hands them out, to be consumed by reporters
 */
export class IssueCollector {
  private rules: Rules;
  private filters: Filters;
  private issues = initIssues();
  private counters = initCounters();
  private referencedFiles = new Set<string>();
  private configurationHints = new Set<ConfigurationHint>();
  private tagHints = new Set<TagHint>();
  private ignorePatterns = new Set<string>();
  private isMatch: (filePath: string) => boolean;
  public cwd: string;

  constructor({ cwd, rules, filters }: IssueCollectorOptions) {
    this.cwd = cwd;
    this.rules = rules;
    this.filters = filters;
    this.isMatch = () => false;
  }

  addIgnorePatterns(patterns: string[]) {
    for (const pattern of patterns) this.ignorePatterns.add(pattern);
    const p = [...this.ignorePatterns];
    this.isMatch = (filePath: string) => isMatch(filePath, p, { dot: true });
  }

  addFileCounts({ processed, unused }: { processed: number; unused: number }) {
    this.counters.processed += processed;
    this.counters.total += processed + unused;
  }

  addFilesIssues(filePaths: string[]) {
    for (const filePath of filePaths) {
      if (this.filters.dir && !filePath.startsWith(`${this.filters.dir}/`)) continue;
      if (this.referencedFiles.has(filePath)) continue;
      if (this.isMatch(filePath)) continue;

      this.issues.files.add(filePath);
      // @ts-expect-error TODO Fix up in next major
      this.issues._files.add({ type: 'files', filePath, symbol: relative(filePath), severity: this.rules.files });

      this.counters.files++;
      this.counters.processed++;
    }
  }

  addIssue(issue: Issue) {
    if (this.filters.dir && !issue.filePath.startsWith(`${this.filters.dir}/`)) return;
    if (this.isMatch(issue.filePath)) return;
    const key = relative(this.cwd, issue.filePath);
    issue.severity = this.rules[issue.type];
    const issues = this.issues[issue.type];
    issues[key] = issues[key] ?? {};
    if (!issues[key][issue.symbol]) {
      issues[key][issue.symbol] = issue;
      this.counters[issue.type]++;
    }
    return issue;
  }

  addConfigurationHint(issue: ConfigurationHint) {
    if (!hasConfigurationHint(this.configurationHints, issue)) {
      this.configurationHints.add(issue);
    }
  }

  addTagHint(issue: TagHint) {
    this.tagHints.add(issue);
  }

  purge() {
    const unusedFiles = this.issues.files;
    this.issues = initIssues();
    this.counters = initCounters();
    return unusedFiles;
  }

  getIssues() {
    return {
      issues: this.issues,
      counters: this.counters,
      tagHints: this.tagHints,
      configurationHints: this.configurationHints,
    };
  }
}
