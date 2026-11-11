import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOptions, createSession, finalizeConfigurationHints, KNIP_CONFIG_LOCATIONS } from 'knip/session';
import { CURATED_RESOURCES } from './curated-resources.js';
import { CLEAN_HINT, CONFIG_REVIEW_HINT, UNCONFIGURED_HINT } from './texts.js';

export { ERROR_HINT } from './texts.js';

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (!(error instanceof Error)) return String(error);
  const messages = [error.message];
  let cause = error.cause;
  while (cause instanceof Error) {
    messages.push(cause.message);
    cause = cause.cause;
  }
  return `${messages.join('\nCaused by: ')}\nCurrent working dir: ${process.cwd()}`;
}

// Built by scripts/build-docs.js (prepack, and the VS Code extension's publish script)
const DOCS_FILE = join(dirname(fileURLToPath(import.meta.url)), 'docs.json');

/** @type {Record<string, { content: string, sections: Record<string, [number, number]> }> | undefined} */
let docs;

const getPages = () => {
  if (!docs) {
    if (!existsSync(DOCS_FILE)) throw new Error(`Missing ${DOCS_FILE}, run \`pnpm --dir packages/mcp-server build\``);
    docs = JSON.parse(readFileSync(DOCS_FILE, 'utf-8'));
  }
  return docs;
};

const MAX_UNUSED_FILES = 50;
const MAX_ISSUES_PER_TYPE = 50;

/**
 * @param {import('knip/session').Results} results
 * @param {{ cwd: string, configFilePath: string | undefined }} options
 */
export function buildResults(results, options) {
  const configurationHints = finalizeConfigurationHints(results, options);

  const maybeUnconfigured = configurationHints.some(
    hint => hint.type === 'top-level-unconfigured' || hint.type === 'workspace-unconfigured'
  );

  const configFile = options.configFilePath
    ? { exists: true, filePath: options.configFilePath }
    : { exists: false, locations: KNIP_CONFIG_LOCATIONS };

  const counters = Object.fromEntries(
    Object.entries(results.counters).filter(([key]) => key !== 'processed' && key !== 'total')
  );

  const totalIssues = Object.values(counters).reduce((sum, count) => sum + count, 0);
  const isClean = totalIssues === 0 && configurationHints.length === 0;
  const reviewHint = maybeUnconfigured
    ? UNCONFIGURED_HINT
    : isClean
      ? CLEAN_HINT
      : options.configFilePath && totalIssues > 0
        ? CONFIG_REVIEW_HINT
        : undefined;

  let truncated = false;

  const unusedFiles = Object.keys(results.issues.files);
  const files = unusedFiles.slice(0, MAX_UNUSED_FILES);
  if (unusedFiles.length > files.length) truncated = true;

  const issues = {};
  for (const [type, byFile] of Object.entries(results.issues)) {
    if (type === 'files' || type === '_files') continue;
    const items = [];
    for (const [file, symbols] of Object.entries(byFile)) {
      for (const issue of Object.values(symbols)) {
        items.push({
          file,
          symbol: issue.symbol,
          line: issue.line ?? issue.symbols?.[0]?.line,
          ...(issue.parentSymbol ? { parent: issue.parentSymbol } : {}),
        });
      }
    }
    if (items.length === 0) continue;
    if (items.length > MAX_ISSUES_PER_TYPE) truncated = true;
    issues[type] = items.slice(0, MAX_ISSUES_PER_TYPE);
  }

  return {
    reviewHint,
    maybeUnconfigured,
    truncated,
    configurationHints,
    counters,
    totalIssues,
    configFile,
    enabledPlugins: results.enabledPlugins,
    files,
    issues,
  };
}

/**
 * @param {string} cwd
 * @param {string[]} [workspace] Scope run to array of workspaces
 */
export async function getResults(cwd, workspace) {
  const options = await createOptions({ cwd, isSession: true, isUseTscFiles: false, workspace });
  const session = await createSession(options);
  return buildResults(session.getResults(), options);
}

/**
 * @param {string} topic Topic id or docs path (e.g. `reference/cli` or `/reference/cli`), optionally with a `#section` anchor
 * @returns {{ content: string } | { error: string }}
 */
export function getDocs(topic) {
  const [id, anchor] = topic.split('#');
  const pages = getPages();
  const pageId = CURATED_RESOURCES[id]?.path ?? id.replace(/^\//, '');
  const page = Object.hasOwn(pages, pageId) ? pages[pageId] : undefined;
  if (!page) {
    return { error: `Documentation not found: ${topic}. Available: ${Object.keys(CURATED_RESOURCES).join(', ')}` };
  }
  if (!anchor) return { content: page.content };
  const section = anchor.toLowerCase();
  if (Object.hasOwn(page.sections, section)) return { content: page.content.slice(...page.sections[section]) };
  return {
    error: `Section not found: ${topic}. Available sections: ${Object.keys(page.sections)
      .map(a => `#${a}`)
      .join(', ')}`,
  };
}
