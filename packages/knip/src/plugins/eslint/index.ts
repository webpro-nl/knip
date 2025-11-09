import type { ParsedArgs } from 'minimist';
import type { IsLoadConfig, IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toDeferResolve, toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { getInputs, resolveFormatters } from './helpers.js';
import type { ESLintConfigDeprecated } from './types.js';

// https://eslint.org/docs/latest/use/configure/configuration-files
// Deprecated: https://eslint.org/docs/latest/use/configure/configuration-files-deprecated

// Note: shareable configs should use `peerDependencies` for plugins
// https://eslint.org/docs/latest/extend/shareable-configs#publishing-a-shareable-config

const title = 'ESLint';

const enablers = ['eslint', '@eslint/js'];

const isEnabled: IsPluginEnabled = ({ dependencies, manifest }) =>
  hasDependency(dependencies, enablers) ||
  Boolean(manifest.name && /(^eslint-config|\/eslint-config)/.test(manifest.name));

const packageJsonPath = 'eslintConfig';

const config = [
  'eslint.config.{js,cjs,mjs,ts,cts,mts}',
  '.eslintrc',
  '.eslintrc.{js,json,cjs}',
  '.eslintrc.{yml,yaml}',
  'package.json',
];

const isLoadConfig: IsLoadConfig = ({ manifest }, dependencies) => {
  const version = manifest.devDependencies?.['eslint'] || manifest.dependencies?.['eslint'];
  if (version) {
    const major = version.match(/\d+/);
    if (major && Number.parseInt(major[0], 10) === 9 && dependencies.has('eslint-config-next')) {
      return false;
    }
  }
  return true;
};

const resolveConfig: ResolveConfig<ESLintConfigDeprecated> = (localConfig, options) => getInputs(localConfig, options);

const note = `### ESLint v9

The ESLint plugin config resolver is disabled when using \`eslint-config-next\` (\`next lint\`).

Root cause: [microsoft/rushstack#4965](https://github.com/microsoft/rushstack/issues/4965)/[#5049](https://github.com/microsoft/rushstack/issues/5049)

### ESLint v8

If relying on [configuration cascading](https://eslint.org/docs/v8.x/use/configure/configuration-files#cascading-and-hierarchy),
consider using an extended glob pattern like this:

\`\`\`json
{
  "eslint": ["**/.eslintrc.js"]
}
\`\`\`
`;

/** @public */
export const docs = { note };

const args = {
  config: true,
  alias: { format: ['f'] },
  boolean: ['inspect-config'],
  resolveInputs: (parsed: ParsedArgs) => {
    const inputs: Input[] = [];
    if (parsed['inspect-config']) inputs.push(toDependency('@eslint/config-inspector', { optional: true }));
    if (parsed['format']) for (const input of resolveFormatters(parsed['format'])) inputs.push(input);
    return inputs;
  },
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  args,
  isLoadConfig,
  resolveConfig,
} satisfies Plugin;
