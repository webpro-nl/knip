import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { isFile } from '../../util/fs.js';

// https://pnpm.io/pnpmfile

const title = 'pnpm';

const isEnabled: IsPluginEnabled = async ({ cwd, manifest }) =>
  manifest.packageManager?.startsWith('pnpm@') ||
  isFile(cwd, 'pnpm-lock.yaml') ||
  isFile(cwd, 'pnpm-workspace.yaml');

const isRootOnly = true;

const config: string[] = ['.pnpmfile.cjs'];

const plugin: Plugin = {
  title,
  isEnabled,
  isRootOnly,
  config,
};

export default plugin;
