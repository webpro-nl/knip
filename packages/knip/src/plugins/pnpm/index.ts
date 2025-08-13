import type { IsPluginEnabled, Plugin } from '../../types/config.js';

// https://pnpm.io/pnpmfile

const title = 'pnpm';

const isEnabled: IsPluginEnabled = ({ manifest }) => Boolean(manifest.packageManager?.startsWith('pnpm@'));

const config: string[] = ['.pnpmfile.cjs'];

export default {
  title,
  isEnabled,
  config,
} satisfies Plugin;
