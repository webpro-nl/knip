import picomatch from 'picomatch';
import type { ConfigurationHint, Issue, Rules, TagHint } from './types/issues.js';
import type { MainOptions } from './util/create-options.js';
import { initCounters, initIssues } from './util/issue-initializers.js';
import { timerify } from './util/Performance.js';
import { join, relative } from './util/path.js';

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
  private cwd: string;
  private rules: Rules;
  private filter: string | undefined;
  private issues = initIssues();
  private counters = initCounters();
  private referencedFiles = new Set<string>();
  private configurationHints = new Set<ConfigurationHint>();
  private tagHints = new Set<TagHint>();
  private ignorePatterns = new Set<string>();
  private isMatch: (filePath: string) => boolean;

  constructor(options: MainOptions) {
    this.cwd = options.cwd;
    this.rules = options.rules;
    this.filter = options.workspace ? join(options.cwd, options.workspace) : undefined;
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
      if (this.filter && !filePath.startsWith(`${this.filter}/`)) continue;
      if (this.referencedFiles.has(filePath)) continue;
      if (this.isMatch(filePath)) continue;

      this.issues.files.add(filePath);
      const symbol = relative(this.cwd, filePath);
      // @ts-expect-error TODO Fix up in next major
      this.issues._files[symbol] = [{ type: 'files', filePath, symbol, severity: this.rules.files }];

      this.counters.files++;
      this.counters.processed++;
    }
  }

  addIssue(issue: Issue) {
    if (this.filter && !issue.filePath.startsWith(`${this.filter}/`)) return;
    if (this.isMatch(issue.filePath)) return;
    const key = relative(this.cwd, issue.filePath);
    const { type } = issue;
    issue.severity = this.rules[type];
    const issues = this.issues[type];
    issues[key] = issues[key] ?? {};
    const symbol = issue.parentSymbol ? `${issue.parentSymbol}.${issue.symbol}` : issue.symbol;
    if (!issues[key][symbol]) {
      issues[key][symbol] = issue;
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
