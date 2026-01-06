import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { findFile } from '../../util/fs.js';

// https://yarnpkg.com/features/constraints

const title = 'Yarn';

const enablers = 'This plugin is enabled when a `yarn.lock` file is found in the root folder.';

const isEnabled: IsPluginEnabled = async ({ cwd }) => Boolean(findFile(cwd, 'yarn.lock'));

const isRootOnly = true;

const entry = ['yarn.config.cjs'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  entry,
};

export default plugin;
