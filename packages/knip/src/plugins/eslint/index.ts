import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { getInputs } from './helpers.js';
import type { ESLintConfigDeprecated } from './types.js';

// New: https://eslint.org/docs/latest/use/configure/configuration-files
// Old: https://eslint.org/docs/latest/use/configure/configuration-files-deprecated

// Note: shareable configs should use `peerDependencies` for plugins
// https://eslint.org/docs/latest/extend/shareable-configs#publishing-a-shareable-config

const title = 'ESLint';

const enablers = ['eslint', '@eslint/js'];

const isEnabled: IsPluginEnabled = ({ dependencies, manifest, config }) =>
  hasDependency(dependencies, enablers) ||
  'eslint' in config ||
  Boolean(manifest.name && /(^eslint-config|\/eslint-config)/.test(manifest.name));

const packageJsonPath = 'eslintConfig';

const entry = ['eslint.config.{js,cjs,mjs,ts,cts,mts}'];

const config = ['.eslintrc', '.eslintrc.{js,json,cjs}', '.eslintrc.{yml,yaml}', 'package.json'];

const resolveConfig: ResolveConfig<ESLintConfigDeprecated> = (localConfig, options) => getInputs(localConfig, options);

const note = `### ESLint v9

Only regular \`import\` statements are considered by default.
The configuration object is not resolved to find dependencies for \`settings\` such as \`"eslint-import-resolver-typescript"\`.
To enable this, lift the \`entry\` to a \`config\` file like so:

\`\`\`json
{
  "eslint": ["eslint.config.ts"]
}
\`\`\`

This is not enabled by default, since this exception may be thrown by a \`@rushstack/eslint-*\` package:

> \`Error: Failed to patch ESLint because the calling module was not recognized.\`

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

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  entry,
  config,
  resolveConfig,
} satisfies Plugin;
