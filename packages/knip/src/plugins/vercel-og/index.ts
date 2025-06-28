import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://vercel.com/docs/functions/og-image-generation

const title = 'Vercel OG';

const enablers = ['next', '@vercel/og'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const production = [
  '{src/,}pages/api/og.{jsx,tsx}',
  '{src/,}app/api/og/route.{jsx,tsx}',
  // 'api/og.{jsx,tsx}', // TODO maybe add for non-Next.js projects
];

export default {
  title,
  enablers,
  isEnabled,
  production,
} satisfies Plugin;
