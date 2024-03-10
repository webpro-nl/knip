import { hasDependency } from '#p/util/plugin.js';
import type { IsPluginEnabled } from '#p/types/plugins.js';

// https://nextjs.org/docs/getting-started/project-structure

const title = 'Next.js';

const enablers = ['next'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['next.config.{js,ts,cjs,mjs}'];

const productionEntryFilePatternsWithoutSrc = [
  '{instrumentation,middleware}.{js,ts}',
  'app/global-error.{js,jsx,ts,tsx}',
  'app/**/{error,layout,loading,not-found,page,template}.{js,jsx,ts,tsx}',
  'app/**/route.{js,ts}',
  'app/**/default.{js,jsx,ts,tsx}',
  'app/{manifest,sitemap,robots}.{js,ts}',
  'app/**/{icon,apple-icon}.{js,jsx,ts,tsx}',
  'app/**/{opengraph,twitter}-image.{js,jsx,ts,tsx}',
  'pages/**/*.{js,jsx,ts,tsx}',
];

const production = [
  ...productionEntryFilePatternsWithoutSrc,
  ...productionEntryFilePatternsWithoutSrc.map(pattern => `src/${pattern}`),
];

export default {
  title,
  enablers,
  isEnabled,
  entry,
  production,
};
