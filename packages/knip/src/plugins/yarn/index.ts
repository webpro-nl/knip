import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { _firstGlob } from '../../util/glob.js';

// https://yarnpkg.com/features/constraints

const title = 'Yarn';

const enablers = 'This plugin is enabled when a `yarn.lock` file is found in the root folder.';

const isEnabled: IsPluginEnabled = async ({ cwd }) => Boolean(await _firstGlob({ cwd, patterns: ['yarn.lock'] }));

const isRootOnly = true;

const entry = ['yarn.config.cjs'];

export default {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  entry,
} satisfies Plugin;
