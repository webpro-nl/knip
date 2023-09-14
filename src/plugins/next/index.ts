import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://nextjs.org/docs/getting-started/project-structure

export const NAME = 'Next.js';

/** @public */
export const ENABLERS = ['next'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const ENTRY_FILE_PATTERNS = ['next.config.{js,ts,cjs,mjs}'];

const productionEntryFilePatternsWithoutSrc = [
  'middleware.{js,ts}',
  'app/**/route.{js,ts}',
  'app/**/{error,layout,loading,not-found,page,template}.{js,jsx,tsx}',
  'instrumentation.{js,ts}',
  'app/{manifest,sitemap,robots}.{js,ts}',
  'app/**/{icon,apple-icon}-image.{js,ts,tsx}',
  'app/**/{opengraph,twitter}-image.{js,ts,tsx}',
  'pages/**/*.{js,jsx,ts,tsx}',
];

export const PRODUCTION_ENTRY_FILE_PATTERNS = [
  ...productionEntryFilePatternsWithoutSrc,
  ...productionEntryFilePatternsWithoutSrc.map(pattern => `src/${pattern}`),
];
