import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://trigger.dev/docs/config/config-file
// https://github.com/triggerdotdev/trigger.dev/blob/39595b25827eec7c18ac17fc00ad50eae610552b/packages/cli-v3/src/config.ts#L45-L59
// https://github.com/triggerdotdev/trigger.dev/blob/39595b25827eec7c18ac17fc00ad50eae610552b/packages/cli-v3/src/config.ts#L208-L216
// https://github.com/triggerdotdev/trigger.dev/blob/39595b25827eec7c18ac17fc00ad50eae610552b/packages/cli-v3/src/build/entryPoints.ts#L21-L67

const title = 'Trigger.dev';

const enablers = ['@trigger.dev/sdk'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['trigger.config.{js,cjs,mjs,ts,cts,mts}'];

const extensions = '{ts,tsx,mts,cts,js,jsx,mjs,cjs}';

// Without `dirs`, every directory named `trigger` holds tasks
const defaultDir = '**/trigger';

const getProductionPatterns = (dirs: Iterable<string>) => [
  ...Array.from(dirs, dir => `${dir}/**/*.${extensions}`),
  '!**/*.{test,spec}.{ts,mts,cts,js,mjs,cjs}',
];

const production = getProductionPatterns([defaultDir]);

const resolveFromAST: ResolveFromAST = (program, { configFileDir }) => {
  const dirs = collectPropertyValues(program, 'dirs');
  const patterns = dirs.size > 0 ? getProductionPatterns(dirs) : production;
  return patterns.map(pattern => toEntry(pattern, { dir: configFileDir, production: true }));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;
