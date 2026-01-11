import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { findFile } from '../../util/fs.js';

// https://pnpm.io/pnpmfile

const title = 'pnpm';

const isEnabled: IsPluginEnabled = async ({ cwd, manifest }) =>
  Boolean(
    manifest.packageManager?.startsWith('pnpm@') ||
      findFile(cwd, 'pnpm-lock.yaml') ||
      findFile(cwd, 'pnpm-workspace.yaml')
  );

const isRootOnly = true;

const config: string[] = ['.pnpmfile.cjs'];

const plugin: Plugin = {
  title,
  isEnabled,
  isRootOnly,
  config,
};

export default plugin;
