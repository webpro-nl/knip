import picomatch from 'picomatch';
import type { IgnoreIssues } from './types/config.js';
import type { ConfigurationHint, ConfigurationHints, Issue, IssueType, Rules, TagHint } from './types/issues.js';
import type { MainOptions } from './util/create-options.js';
import { initCounters, initIssues } from './util/issue-initializers.js';
import { timerify } from './util/Performance.js';
import { join, relative } from './util/path.js';

const isMatch = timerify(picomatch.isMatch, 'isMatch');

export type CollectorIssues = ReturnType<IssueCollector['getIssues']>;

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
  private configurationHints: ConfigurationHints = new Map();
  private tagHints = new Set<TagHint>();
  private ignorePatterns = new Set<string>();
  private ignoreFilesPatterns = new Set<string>();
  private isMatch: (filePath: string) => boolean;
  private isFileMatch: (filePath: string) => boolean;
  private issueMatchers: Map<IssueType, (filePath: string) => boolean> = new Map();

  constructor(options: MainOptions) {
    this.cwd = options.cwd;
    this.rules = options.rules;
    this.filter = options.workspace ? join(options.cwd, options.workspace) : undefined;
    this.isMatch = () => false;
    this.isFileMatch = () => false;
  }

  addIgnorePatterns(patterns: string[]) {
    for (const pattern of patterns) this.ignorePatterns.add(pattern);
    const p = [...this.ignorePatterns];
    this.isMatch = (filePath: string) => isMatch(filePath, p, { dot: true });
  }

  addIgnoreFilesPatterns(patterns: string[]) {
    for (const pattern of patterns) this.ignoreFilesPatterns.add(pattern);
    const p = [...this.ignoreFilesPatterns];
    this.isFileMatch = (filePath: string) => isMatch(filePath, p, { dot: true });
  }

  setIgnoreIssues(ignoreIssues?: IgnoreIssues) {
    if (!ignoreIssues) return;

    // Pre-compile matchers for each issue type
    const issueTypePatterns = new Map<IssueType, string[]>();
    for (const [pattern, issueTypes] of Object.entries(ignoreIssues)) {
      for (const issueType of issueTypes) {
        if (!issueTypePatterns.has(issueType)) {
          issueTypePatterns.set(issueType, []);
        }
        issueTypePatterns.get(issueType)?.push(pattern);
      }
    }

    for (const [issueType, patterns] of issueTypePatterns) {
      this.issueMatchers.set(issueType, (filePath: string) => isMatch(filePath, patterns, { dot: true }));
    }
  }

  private shouldIgnoreIssue(filePath: string, issueType: IssueType): boolean {
    const matcher = this.issueMatchers.get(issueType);
    if (!matcher) return false;

    // Match against relative path
    const relativePath = relative(this.cwd, filePath);
    return matcher(relativePath);
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
      if (this.isFileMatch(filePath)) continue;
      if (this.shouldIgnoreIssue(filePath, 'files')) continue;

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
    if (this.shouldIgnoreIssue(issue.filePath, issue.type)) return;
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
    return true;
  }

  addConfigurationHint(issue: ConfigurationHint) {
    const key = `${issue.workspaceName}::${issue.type}::${issue.identifier}`;
    if (!this.configurationHints.has(key)) this.configurationHints.set(key, issue);
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
      configurationHints: new Set(this.configurationHints.values()),
    };
  }

  // Retain issues from `handleInput` that would otherwise get lost between analysis runs (e.g. in watch mode)
  private retainedIssues: Issue[] = [];
  retainIssue(issue: Issue) {
    this.retainedIssues.push(issue);
  }
  getRetainedIssues() {
    return this.retainedIssues;
  }
}
