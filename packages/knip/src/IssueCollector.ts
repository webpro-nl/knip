import picomatch from 'picomatch';
import type { IgnoreIssues } from './types/config.js';
import type { ConfigurationHint, ConfigurationHints, Issue, IssueType, Rules, TagHint } from './types/issues.js';
import { partition } from './util/array.js';
import type { MainOptions } from './util/create-options.js';
import { initCounters, initIssues } from './util/issue-initializers.js';
import { relative } from './util/path.js';
import type { WorkspaceFilePathFilter } from './util/workspace-file-filter.js';

const createMatcher = (patterns: Set<string>) => {
  const [negated, positive] = partition(patterns, p => p[0] === '!');
  if (positive.length === 0) {
    if (negated.length === 0) return () => false;
    return picomatch(negated, { dot: true });
  }
  return picomatch(positive, { dot: true, ignore: negated.map(p => p.slice(1)) });
};

export type CollectorIssues = ReturnType<IssueCollector['getIssues']>;

/**
 * - Collects issues and counts them
 * - Hands them out, to be consumed by reporters
 */
export class IssueCollector {
  private cwd: string;
  private rules: Rules;
  private workspaceFilter: (filePath: string) => boolean;
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
  private unusedIgnorePatterns: Map<string, ConfigurationHint> = new Map();
  private unusedIgnoreFilesPatterns: Map<string, ConfigurationHint> = new Map();

  constructor(options: MainOptions) {
    this.cwd = options.cwd;
    this.rules = options.rules;
    this.workspaceFilter = () => true;
    this.isMatch = () => false;
    this.isFileMatch = () => false;
  }

  setWorkspaceFilter(workspaceFilePathFilter: WorkspaceFilePathFilter | undefined) {
    if (workspaceFilePathFilter) this.workspaceFilter = workspaceFilePathFilter;
  }

  addIgnorePatterns(entries: { pattern: string; id: string; workspaceName?: string }[]) {
    for (const entry of entries) {
      this.ignorePatterns.add(entry.pattern);
      if (!entry.pattern.startsWith('!') && !this.unusedIgnorePatterns.has(entry.pattern)) {
        this.unusedIgnorePatterns.set(entry.pattern, {
          type: 'ignore',
          identifier: entry.id,
          workspaceName: entry.workspaceName,
        });
      }
    }
    this.isMatch = createMatcher(this.ignorePatterns);
  }

  addIgnoreFilesPatterns(entries: { pattern: string; id: string; workspaceName?: string }[]) {
    for (const entry of entries) {
      this.ignoreFilesPatterns.add(entry.pattern);
      if (!entry.pattern.startsWith('!') && !this.unusedIgnoreFilesPatterns.has(entry.pattern)) {
        this.unusedIgnoreFilesPatterns.set(entry.pattern, {
          type: 'ignoreFiles',
          identifier: entry.id,
          workspaceName: entry.workspaceName,
        });
      }
    }
    this.isFileMatch = createMatcher(this.ignoreFilesPatterns);
  }

  private markUsedPatterns(filePath: string, unused: Map<string, ConfigurationHint>) {
    for (const pattern of unused.keys()) {
      if (picomatch.isMatch(filePath, pattern, { dot: true })) unused.delete(pattern);
    }
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
      this.issueMatchers.set(issueType, picomatch(patterns, { dot: true }));
    }
  }

  private shouldIgnoreIssue(filePath: string, issueType: IssueType): boolean {
    const matcher = this.issueMatchers.get(issueType);
    if (!matcher) return false;
    return matcher(relative(this.cwd, filePath));
  }

  addFileCounts({ processed, unused }: { processed: number; unused: number }) {
    this.counters.processed += processed;
    this.counters.total += processed + unused;
  }

  addFilesIssues(filePaths: string[]) {
    for (const filePath of filePaths) {
      if (!this.workspaceFilter(filePath)) continue;
      if (this.referencedFiles.has(filePath)) continue;
      if (this.isMatch(filePath)) {
        this.markUsedPatterns(filePath, this.unusedIgnorePatterns);
        continue;
      }
      if (this.isFileMatch(filePath)) {
        this.markUsedPatterns(filePath, this.unusedIgnoreFilesPatterns);
        continue;
      }
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
    if (!this.workspaceFilter(issue.filePath)) return;
    if (this.isMatch(issue.filePath)) {
      this.markUsedPatterns(issue.filePath, this.unusedIgnorePatterns);
      return;
    }
    if (this.shouldIgnoreIssue(issue.filePath, issue.type)) return;
    if (this.rules[issue.type] === 'off') return;
    const key = relative(this.cwd, issue.filePath);
    issue.severity = this.rules[issue.type];
    const issues = this.issues[issue.type];
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
      configurationHints: Array.from(this.configurationHints.values()),
    };
  }

  getUnusedIgnorePatternHints() {
    return [...this.unusedIgnorePatterns.values(), ...this.unusedIgnoreFilesPatterns.values()];
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
