import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://expressive-code.com/reference/configuration/

const title = 'Expressive Code';

const enablers = [
  'astro-expressive-code', // Astro integration
  'rehype-expressive-code', // Next.js/rehype integration
  '@astrojs/starlight', // Starlight (has expressive-code built-in)
];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['ec.config.{js,mjs,cjs,ts}'];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
