import { readFileSync } from 'node:fs';
import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { debugLog } from '../../util/debug.ts';
import { _glob } from '../../util/glob.ts';
import { type Input, toEntryPath } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://encore.dev/docs/ts/primitives/app-structure
// https://github.com/encoredev/encore/blob/v1.58.10/tsparser/src/parser/parser.rs#L35-L42
// https://github.com/encoredev/encore/tree/v1.58.10/tsparser/src/parser/resources

const title = 'Encore';

const enablers = ['encore.dev'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const production = ['**/encore.service.ts'];

const patterns = [
  '**/*.ts',
  '!**/node_modules/**',
  '!**/encore.gen/**',
  '!**/__tests__/**',
  '!**/.*/**',
  '!**/*.{test,spec}.ts',
];

const resourceImportMatcher =
  /import\s*\{([^}]*)\}\s*from\s*['"]encore\.dev\/(?:api|service|auth|cron|pubsub|config|metrics|storage\/(?:sqldb|objects|cache))['"]/g;

const resources = new Set([
  'api',
  'Gateway',
  'Service',
  'authHandler',
  'CronJob',
  'Topic',
  'Subscription',
  'SQLDatabase',
  'Bucket',
  'CacheCluster',
  'secret',
  'Counter',
  'CounterGroup',
  'Gauge',
  'GaugeGroup',
]);

const hasResourceImport = (source: string) => {
  for (const [, specifiers] of source.matchAll(resourceImportMatcher)) {
    for (const specifier of specifiers.split(',')) {
      const name = specifier.trim().split(/\s+/)[0];
      if (resources.has(name)) return true;
    }
  }
  return false;
};

const resolve: Resolve = async options => {
  const inputs: Input[] = [];
  for (const filePath of await _glob({ cwd: options.cwd, patterns })) {
    let source: string;
    try {
      source = readFileSync(filePath, 'utf8');
    } catch (error) {
      debugLog(title, `Unable to read ${filePath} (${error instanceof Error ? error.message : error})`);
      continue;
    }
    if (source.includes('encore.dev/') && hasResourceImport(source)) {
      inputs.push(toEntryPath(filePath, { production: true }));
    }
  }
  return inputs;
};

const note = `Encore loads every \`.ts\` file that defines a resource, such as an endpoint, cron job or subscription, without importing it.
The plugin marks files with a value import of a resource from an \`encore.dev\` module as production entry files.
It expects \`encore.app\` in the workspace directory.
A custom \`entry\` option replaces the default \`encore.service.ts\` pattern, but these files are still added.`;

/** @public */
export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  production,
  resolve,
};

export default plugin;
