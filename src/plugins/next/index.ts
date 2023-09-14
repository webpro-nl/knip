import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback } from '../../types/plugins.js';

export const NAME = 'Next.js';

/** @public */
export const ENABLERS = ['next'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const ENTRY_FILE_PATTERNS = ['next.config.{js,ts,cjs,mjs}'];

const productionEntryFilePatternsWithoutSrc = [
  'next-env.d.ts',
  'middleware.{js,ts}',

  // https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
  'app/**/route.{js,ts}',
  'app/**/{error,layout,loading,not-found,page,template}.{jsx,tsx}',
  'instrumentation.{js,ts}',
  'app/{manifest,sitemap,robots}.{js,ts}',
  'app/**/{icon,apple-icon}-image.{js,ts,tsx}',
  'app/**/{opengraph,twitter}-image.{js,ts,tsx}',

  // https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts
  'pages/**/*.{js,jsx,ts,tsx}',
];

export const PRODUCTION_ENTRY_FILE_PATTERNS = [
  ...productionEntryFilePatternsWithoutSrc,
  ...productionEntryFilePatternsWithoutSrc.map(pattern => `src/${pattern}`),
];
