import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { _glob } from '../../util/glob.js';

// https://yarnpkg.com/features/constraints

const title = 'yarn';

const enablers = 'This plugin is enabled when a `yarn.lock` file is found in the root folder.';

const isEnabled: IsPluginEnabled = async ({ cwd }) => (await _glob({ cwd, patterns: ['yarn.lock'] })).length > 0;

const entry: string[] = ['yarn.config.cjs'];

export default {
  title,
  enablers,
  isEnabled,
  entry,
} satisfies Plugin;
