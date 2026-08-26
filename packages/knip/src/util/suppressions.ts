import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { DEFAULT_SUPPRESSIONS_FILE, ISSUE_TYPES } from '../constants.ts';
import type { Counters, IssueRecords, Issues, IssueType, Rules } from '../types/issues.ts';
import type {
  AnalysisScope,
  ApplyResult,
  SuppressionMeta,
  Suppressions,
  SuppressionsByType,
  SuppressionScope,
} from '../types/suppressions.ts';
import { initIssues } from './issue-initializers.ts';
import { timerify } from './Performance.ts';
import { join } from './path.ts';

const getRecords = (issues: Issues, issueType: string) => issues[issueType as IssueType] as IssueRecords;

const getDefaultSuppressionsFilePath = (cwd: string) => join(cwd, DEFAULT_SUPPRESSIONS_FILE);

const loadSuppressions = async (filePath: string): Promise<Suppressions | undefined> => {
  if (!existsSync(filePath)) return undefined;
  const contents = await readFile(filePath, 'utf8');
  return JSON.parse(contents);
};

const saveSuppressions = async (filePath: string, suppressions: Suppressions) => {
  await writeFile(filePath, stringify(suppressions));
};

/** @internal */
export const generateSuppressions = (issues: Issues, rules?: Rules): Suppressions => {
  const entries: Record<string, SuppressionsByType> = {};

  for (const issueType of ISSUE_TYPES) {
    if (rules && rules[issueType] !== 'error') continue;
    const records = getRecords(issues, issueType);
    for (const [relPath, symbolMap] of Object.entries(records)) {
      if (!entries[relPath]) entries[relPath] = {};
      const symbolNames = Object.keys(symbolMap);
      if (symbolNames.length === 0) continue;

      const symbols: Record<string, SuppressionMeta> = {};
      for (const name of symbolNames) symbols[name] = {};
      entries[relPath][issueType] = symbols;
    }
  }

  return { version: 1, suppressions: entries };
};

/** @internal */
export const applySuppressions = (issues: Issues, bulk: Suppressions, rules?: Rules): ApplyResult => {
  const suppressedIssues = initIssues();
  let suppressedCount = 0;

  for (const [key, byType] of Object.entries(bulk.suppressions)) {
    for (const issueType of ISSUE_TYPES) {
      const entry = byType[issueType];
      if (!entry) continue;
      if (rules && rules[issueType] !== 'error') continue;

      const records = getRecords(issues, issueType);
      let matchedAny = false;
      for (const symbol of Object.keys(entry)) {
        const issue = records[key]?.[symbol];
        if (issue) {
          const suppressed = getRecords(suppressedIssues, issueType);
          suppressed[key] = suppressed[key] ?? {};
          suppressed[key][symbol] = issue;
          delete records[key][symbol];
          suppressedCount++;
          matchedAny = true;
        }
      }

      if (matchedAny && records[key] && Object.keys(records[key]).length === 0) delete records[key];
    }
  }

  return { suppressedCount, suppressedIssues };
};

/**
 * An entry survives if its issue is still current, which means either still reported or currently
 * held back by this same file — `applySuppressions` has already moved the latter out of `issues`.
 * @internal
 */
export const pruneSuppressions = (
  issues: Issues,
  suppressedIssues: Issues,
  bulk: Suppressions,
  isInScope: SuppressionScope
): Suppressions => {
  const pruned: Record<string, SuppressionsByType> = {};

  for (const [key, byType] of Object.entries(bulk.suppressions)) {
    const prunedByType: SuppressionsByType = {};

    for (const issueType of ISSUE_TYPES) {
      const entry = byType[issueType];
      if (!entry) continue;

      if (!isInScope(key, issueType)) {
        prunedByType[issueType] = entry;
        continue;
      }

      const records = getRecords(issues, issueType);
      const suppressedRecords = getRecords(suppressedIssues, issueType);
      const remaining: Record<string, SuppressionMeta> = {};
      for (const [s, meta] of Object.entries(entry)) {
        if (records[key]?.[s] || suppressedRecords[key]?.[s]) remaining[s] = meta;
      }
      if (Object.keys(remaining).length > 0) {
        prunedByType[issueType] = remaining;
      }
    }

    if (Object.keys(prunedByType).length > 0) pruned[key] = prunedByType;
  }

  return { version: 1, suppressions: pruned };
};

/** @internal */
export const mergeSuppressions = (existing: Suppressions, incoming: Suppressions): Suppressions => {
  const merged: Record<string, SuppressionsByType> = {};

  const allKeys = new Set([...Object.keys(existing.suppressions), ...Object.keys(incoming.suppressions)]);

  for (const key of allKeys) {
    const existingByType: SuppressionsByType = existing.suppressions[key] ?? {};
    const incomingByType: SuppressionsByType = incoming.suppressions[key] ?? {};
    const mergedByType: SuppressionsByType = {};

    for (const issueType of ISSUE_TYPES) {
      const existingEntry = existingByType[issueType];
      const incomingEntry = incomingByType[issueType];

      if (!incomingEntry) {
        if (existingEntry) mergedByType[issueType] = existingEntry;
        continue;
      }

      if (!existingEntry) {
        mergedByType[issueType] = incomingEntry;
        continue;
      }

      const symbols: Record<string, SuppressionMeta> = {};
      for (const [s, meta] of Object.entries(existingEntry)) symbols[s] = meta;
      for (const [s, meta] of Object.entries(incomingEntry)) {
        if (!symbols[s]) symbols[s] = meta;
      }
      mergedByType[issueType] = symbols;
    }

    if (Object.keys(mergedByType).length > 0) merged[key] = mergedByType;
  }

  return { version: 1, suppressions: merged };
};

interface SuppressionsOptions {
  cwd: string;
  isProduction: boolean;
  isSuppressAll: boolean;
  isPruneSuppressions: boolean;
  suppressionsFilePath?: string;
  noSuppressions: boolean;
  checkSuppressions: boolean;
  rules: Rules;
}

export interface SuppressionsState {
  suppressions: Suppressions;
  suppressedIssues: Issues;
  suppressedCount: number;
}

const countEntries = (suppressions: Suppressions) => {
  let count = 0;
  for (const byType of Object.values(suppressions.suppressions)) {
    for (const entry of Object.values(byType)) count += Object.keys(entry).length;
  }
  return count;
};

const getSuppressionsFilePath = (options: SuppressionsOptions) =>
  options.suppressionsFilePath ?? getDefaultSuppressionsFilePath(options.cwd);

const createScope =
  (options: SuppressionsOptions, scope: AnalysisScope): SuppressionScope =>
  (key, issueType) => {
    if (options.rules[issueType] !== 'error') return false;
    const entryPath = join(options.cwd, key);
    if (!scope.workspaceFilePathFilter(entryPath)) return false;
    return scope.isConsidered(entryPath) || !existsSync(entryPath);
  };

/**
 * Moves suppressed issues out of the report and into a sidecar. Pure: reads the suppressions file,
 * never writes it, so editors and agents can share it with the CLI.
 */
const readAndApplySuppressions = async (
  issues: Issues,
  counters: Counters,
  options: SuppressionsOptions
): Promise<SuppressionsState | undefined> => {
  if (options.isProduction || options.isSuppressAll || options.noSuppressions) return undefined;

  const suppressions = await loadSuppressions(getSuppressionsFilePath(options));
  if (!suppressions) return undefined;

  const { suppressedCount, suppressedIssues } = applySuppressions(issues, suppressions, options.rules);

  for (const issueType of ISSUE_TYPES) {
    const records = getRecords(issues, issueType);
    let count = 0;
    for (const rec of Object.values(records)) count += Object.keys(rec).length;
    counters[issueType] = count;
  }

  return { suppressions, suppressedIssues, suppressedCount };
};

export const _readAndApplySuppressions = timerify(readAndApplySuppressions);

/**
 * Updates the suppressions file, but only when asked to. CLI only — never call this from a session,
 * and never let a plain run write: this file is committed, and a read should not change it.
 */
export const writeSuppressions = async (
  issues: Issues,
  options: SuppressionsOptions,
  scope: AnalysisScope,
  state: SuppressionsState | undefined
): Promise<{ message: string } | { staleCount: number }> => {
  const filePath = getSuppressionsFilePath(options);
  const location = options.suppressionsFilePath ?? DEFAULT_SUPPRESSIONS_FILE;
  const isInScope = createScope(options, scope);

  if (options.isSuppressAll) {
    const newSuppressions = generateSuppressions(issues, options.rules);
    const existing = await loadSuppressions(filePath);
    const merged = existing
      ? mergeSuppressions(pruneSuppressions(issues, initIssues(), existing, isInScope), newSuppressions)
      : newSuppressions;
    await saveSuppressions(filePath, merged);
    return { message: `Suppressions written to ${location}` };
  }

  if (!state) return { staleCount: 0 };

  const updated = pruneSuppressions(issues, state.suppressedIssues, state.suppressions, isInScope);
  const staleCount = countEntries(state.suppressions) - countEntries(updated);

  if (options.isPruneSuppressions) {
    if (staleCount > 0) await saveSuppressions(filePath, updated);
    return { message: `Pruned ${staleCount} ${staleCount === 1 ? 'suppression' : 'suppressions'} from ${location}` };
  }

  return { staleCount };
};

/** @internal */
export const stringify = (data: Suppressions) => {
  const files = Object.keys(data.suppressions).sort();
  let out = '{\n  "version": 1,\n  "suppressions": {';
  for (let i = 0; i < files.length; i++) {
    if (i) out += ',';
    const byType = data.suppressions[files[i]];
    out += `\n    ${JSON.stringify(files[i])}: {`;
    let tj = 0;
    for (const t of Object.keys(byType).sort() as IssueType[]) {
      const entry = byType[t];
      if (!entry) continue;
      if (tj++) out += ',';
      out += `\n      ${JSON.stringify(t)}: {`;
      const symbols = Object.keys(entry).sort();
      for (let k = 0; k < symbols.length; k++) {
        if (k) out += ',';
        out += `\n        ${JSON.stringify(symbols[k])}: ${JSON.stringify(entry[symbols[k]])}`;
      }
      out += '\n      }';
    }
    out += '\n    }';
  }
  out += '\n  }\n}\n';
  return out;
};
