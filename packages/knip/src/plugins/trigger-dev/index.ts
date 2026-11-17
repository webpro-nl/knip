import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
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

const defaultIgnorePatterns = ['**/*.{test,spec}.{ts,mts,cts,js,mjs,cjs}'];

const getProductionPatterns = (dirs: Iterable<string>, ignorePatterns: Iterable<string>) => [
  ...Array.from(dirs, dir => `${dir}/**/*.${extensions}`),
  ...Array.from(ignorePatterns, pattern => `!${pattern}`),
];

const production = getProductionPatterns([defaultDir], defaultIgnorePatterns);

const resolveFromAST: ResolveFromAST = (program, { configFileDir }) => {
  const triggerDirectories = collectPropertyValues(program, 'triggerDirectories');
  const dirs = triggerDirectories.size > 0 ? triggerDirectories : collectPropertyValues(program, 'dirs');
  const ignorePatterns = collectPropertyValues(program, 'ignorePatterns');
  const patterns = getProductionPatterns(
    dirs.size > 0 ? dirs : [defaultDir],
    ignorePatterns.size > 0 ? ignorePatterns : defaultIgnorePatterns
  );
  return patterns.map(pattern =>
    toEntry(pattern.startsWith('!') ? `!${join(configFileDir, pattern.slice(1))}` : join(configFileDir, pattern), {
      production: true,
    })
  );
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
