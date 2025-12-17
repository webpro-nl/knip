import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOptions, createSession, finalizeConfigurationHints, KNIP_CONFIG_LOCATIONS } from 'knip/session';
import { CURATED_RESOURCES } from './curated-resources.js';
import { CONFIG_REVIEW_HINT } from './texts.js';

export { ERROR_HINT } from './texts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '../docs');

/**
 * @param {import('knip/session').Results} results
 * @param {{ cwd: string, configFilePath: string | undefined }} options
 */
export function buildResults(results, options) {
  return {
    configFile: options.configFilePath
      ? { exists: true, filePath: options.configFilePath, reviewHint: CONFIG_REVIEW_HINT }
      : { exists: false, locations: KNIP_CONFIG_LOCATIONS },
    configurationHints: finalizeConfigurationHints(results, options),
    counters: results.counters,
    files: Array.from(results.issues.files),
    issues: Object.fromEntries(Object.entries(results.issues).filter(([key]) => key !== 'files' && key !== '_files')),
  };
}

/**
 * @param {string} cwd
 */
export async function getResults(cwd) {
  const options = await createOptions({ cwd, isSession: true, isUseTscFiles: false });
  const session = await createSession(options);
  return buildResults(session.getResults(), options);
}

/** @param {string} filePath */
export function readContent(filePath) {
  try {
    const content = readFileSync(join(docsDir, filePath), 'utf-8');
    return content.replace(/^---[\s\S]*?---\n/, '');
  } catch (error) {
    return `Error reading ${filePath}: ${error.message}`;
  }
}

/**
 * @param {string} topic
 * @returns {{ content: string } | { error: string }}
 */
export function getDocs(topic) {
  const content = findDocPage(topic);
  if (content) return { content };
  return { error: `Documentation not found: ${topic}. Available: ${Object.keys(CURATED_RESOURCES).join(', ')}` };
}

/** @param {string} topic */
function findDocPage(topic) {
  if (CURATED_RESOURCES[topic]) return readContent(CURATED_RESOURCES[topic].path);

  for (const ext of ['.md', '.mdx']) {
    const filePath = join(docsDir, `${topic}${ext}`);
    if (existsSync(filePath)) return readContent(`${topic}${ext}`);
  }

  return null;
}
