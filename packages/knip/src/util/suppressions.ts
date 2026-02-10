import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { DEFAULT_SUPPRESSIONS_FILE, ISSUE_TYPES } from '../constants.js';
import type { Counters, IssueRecords, Issues, IssueType, Rules } from '../types/issues.js';
import type { ApplyResult, SuppressionMeta, Suppressions, SuppressionsByType } from '../types/suppressions.js';
import { timerify } from './Performance.js';
import { join } from './path.js';

const isExpired = (until: string | undefined, now: string) => until !== undefined && until <= now;

const getToday = () => new Date().toISOString().slice(0, 10);

const getRecords = (issues: Issues, issueType: string) =>
  (issueType === 'files' ? issues._files : issues[issueType as IssueType]) as IssueRecords;

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
export const generateSuppressions = (issues: Issues, until?: string, rules?: Rules): Suppressions => {
  const entries: Record<string, SuppressionsByType> = {};
  const meta: SuppressionMeta = until ? { until } : {};

  for (const issueType of ISSUE_TYPES) {
    if (rules && rules[issueType] !== 'error') continue;
    const records = getRecords(issues, issueType);
    for (const [relPath, symbolMap] of Object.entries(records)) {
      if (!entries[relPath]) entries[relPath] = {};
      const symbolNames = Object.keys(symbolMap);
      if (symbolNames.length === 0) continue;

      const symbols: Record<string, SuppressionMeta> = {};
      for (const name of symbolNames) symbols[name] = { ...meta };
      entries[relPath][issueType] = symbols;
    }
  }

  return { version: 1, suppressions: entries };
};

/** @internal */
export const applySuppressions = (issues: Issues, bulk: Suppressions, rules?: Rules): ApplyResult => {
  const now = getToday();
  let suppressedCount = 0;
  let expiredCount = 0;

  for (const [key, byType] of Object.entries(bulk.suppressions)) {
    for (const issueType of ISSUE_TYPES) {
      const entry = byType[issueType];
      if (!entry) continue;
      if (rules && rules[issueType] !== 'error') continue;

      const records = getRecords(issues, issueType);
      let matchedAny = false;
      for (const symbol of Object.keys(entry)) {
        if (isExpired(entry[symbol].until, now)) {
          expiredCount++;
          continue;
        }
        if (records[key]?.[symbol]) {
          delete records[key][symbol];
          suppressedCount++;
          matchedAny = true;
        }
      }

      if (matchedAny && records[key] && Object.keys(records[key]).length === 0) delete records[key];
    }
  }

  return { suppressedCount, expiredCount };
};

/** @internal */
export const pruneSuppressions = (issues: Issues, bulk: Suppressions): Suppressions => {
  const now = getToday();
  const pruned: Record<string, SuppressionsByType> = {};

  for (const [key, byType] of Object.entries(bulk.suppressions)) {
    const prunedByType: SuppressionsByType = {};

    for (const issueType of ISSUE_TYPES) {
      const entry = byType[issueType];
      if (!entry) continue;

      const records = getRecords(issues, issueType);
      if (!records[key]) continue;

      const remaining: Record<string, SuppressionMeta> = {};
      for (const [s, meta] of Object.entries(entry)) {
        if (isExpired(meta.until, now)) continue;
        if (records[key][s]) remaining[s] = meta;
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

interface HandleSuppressionsOptions {
  cwd: string;
  isSuppressAll: boolean;
  suppressUntil?: string;
  suppressionsFilePath?: string;
  noSuppressions: boolean;
  rules: Rules;
}

type HandleSuppressionsResult =
  | { action: 'generated'; message: string }
  | {
      action: 'applied';
      suppressedCount: number;
      expiredCount: number;
      isChanged: boolean;
    }
  | { action: 'none' };

const handleSuppressions = async (
  issues: Issues,
  counters: Counters,
  options: HandleSuppressionsOptions
): Promise<HandleSuppressionsResult> => {
  const filePath = options.suppressionsFilePath ?? getDefaultSuppressionsFilePath(options.cwd);

  if (options.isSuppressAll) {
    const newSuppressions = generateSuppressions(issues, options.suppressUntil, options.rules);
    const existing = await loadSuppressions(filePath);
    const merged = existing ? mergeSuppressions(existing, newSuppressions) : newSuppressions;
    await saveSuppressions(filePath, merged);
    return {
      action: 'generated',
      message: `Suppressions written to ${options.suppressionsFilePath ?? DEFAULT_SUPPRESSIONS_FILE}`,
    };
  }

  if (options.noSuppressions) return { action: 'none' };

  const existing = await loadSuppressions(filePath);
  if (!existing) return { action: 'none' };

  const updated = pruneSuppressions(issues, existing);
  const result = applySuppressions(issues, existing, options.rules);

  for (const issueType of ISSUE_TYPES) {
    const records = getRecords(issues, issueType);
    let count = 0;
    for (const rec of Object.values(records)) count += Object.keys(rec).length;
    counters[issueType] = count;
  }

  const isChanged = JSON.stringify(existing) !== JSON.stringify(updated);
  if (isChanged) await saveSuppressions(filePath, updated);

  return {
    action: 'applied',
    suppressedCount: result.suppressedCount,
    expiredCount: result.expiredCount,
    isChanged,
  };
};

export const _handleSuppressions = timerify(handleSuppressions);

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
