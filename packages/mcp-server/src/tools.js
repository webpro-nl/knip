import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createOptions,
  createSession,
  finalizeConfigurationHints,
  KNIP_CONFIG_LOCATIONS,
  version as knipVersion,
} from 'knip/session';
import { CURATED_RESOURCES, ISSUE_TYPE_DOCS } from './curated-resources.js';
import { CLEAN_HINT, CONFIG_REVIEW_HINT, getVersionHint, UNCONFIGURED_HINT } from './texts.js';

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

const UNCONFIGURED_HINT_TYPES = new Set(['top-level-unconfigured', 'workspace-unconfigured']);

/**
 * Version of knip installed in the project, which may differ from the bundled one that runs here
 * @param {string} cwd
 * @returns {string | undefined}
 */
function getProjectKnipVersion(cwd) {
  // createRequire needs an absolute path, and the VS Code extension may pass a relative cwd
  const dirs = createRequire(resolve(cwd, 'package.json')).resolve.paths('knip') ?? [];
  for (const dir of dirs) {
    const filePath = join(dir, 'knip', 'package.json');
    if (!existsSync(filePath)) continue;
    try {
      return JSON.parse(readFileSync(filePath, 'utf-8')).version;
    } catch {
      return;
    }
  }
}

/**
 * Doc topics (incl. sections) that apply to the configuration hints and issues of a run
 * @param {{ type: string }[]} configurationHints
 * @param {boolean} maybeUnconfigured
 * @param {string[]} issueTypes
 */
function getDocsForResults(configurationHints, maybeUnconfigured, issueTypes) {
  const docs = new Set();
  if (maybeUnconfigured) {
    docs.add('how-knip-works');
    docs.add('configuring-project-files');
  }
  if (configurationHints.some(hint => hint.type === 'workspace-unconfigured')) docs.add('monorepos-and-workspaces');
  if (configurationHints.some(hint => !UNCONFIGURED_HINT_TYPES.has(hint.type))) docs.add('configuration-hints');
  for (const type of issueTypes) if (ISSUE_TYPE_DOCS[type]) docs.add(ISSUE_TYPE_DOCS[type]);
  return [...docs];
}

/**
 * @param {import('knip/session').Results} results
 * @param {{ cwd: string, configFilePath: string | undefined }} options
 */
export function buildResults(results, options) {
  const configurationHints = finalizeConfigurationHints(results, options).map(hint =>
    hint.identifier instanceof RegExp ? { ...hint, identifier: hint.identifier.source } : hint
  );

  const maybeUnconfigured = configurationHints.some(hint => UNCONFIGURED_HINT_TYPES.has(hint.type));

  const projectKnipVersion = getProjectKnipVersion(options.cwd);
  const versionHint =
    projectKnipVersion && projectKnipVersion !== knipVersion
      ? getVersionHint(knipVersion, projectKnipVersion)
      : undefined;

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

  /** @type {string[]} */
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

  const issueTypes = [...(unusedFiles.length > 0 ? ['files'] : []), ...Object.keys(issues)];

  return {
    reviewHint,
    ...(versionHint ? { versionHint } : {}),
    knipVersion,
    ...(projectKnipVersion ? { projectKnipVersion } : {}),
    maybeUnconfigured,
    truncated,
    configurationHints,
    docs: getDocsForResults(configurationHints, maybeUnconfigured, issueTypes),
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
