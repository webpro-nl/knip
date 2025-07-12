import type { IsLoadConfig, IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { getInputs } from './helpers.js';
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

### \`eslint-import-resolver-typescript\`

If you're using \`eslint-plugin-import\` or \`eslint-plugin-import-x\` with custom resolvers, you have to specify them in ESLint's config even if they're normally picked up automatically by those plugins:

consider using an extended glob pattern like this:

\`\`\`js

export default [
  {
    settings: {
      "import/resolver": {
        typescript: true,
      },
    },
  },

  // The rest of your tsconfig
]
\`\`\`
`;

/** @public */
export const docs = { note };

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  isLoadConfig,
  resolveConfig,
} satisfies Plugin;
