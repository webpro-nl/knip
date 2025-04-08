import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { getPageExtensions } from './resolveFromAST.js';

// https://nextjs.org/docs/getting-started/project-structure

const title = 'Next.js';

const enablers = ['next'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['next.config.{js,ts,cjs,mjs}'];

const defaultPageExtensions = ['{js,jsx,ts,tsx}'];

const productionEntryFilePatterns = [
  '{instrumentation,middleware}.{js,ts}',
  'app/global-error.{js,jsx,ts,tsx}',
  'app/**/{error,layout,loading,not-found,page,template,default}.{js,jsx,ts,tsx}',
  'app/**/route.{js,jsx,ts,tsx}',
  'app/{manifest,sitemap,robots}.{js,ts}',
  'app/**/{icon,apple-icon}.{js,jsx,ts,tsx}',
  'app/**/{opengraph,twitter}-image.{js,jsx,ts,tsx}',
];

const getEntryFilePatterns = (pageExtensions = defaultPageExtensions) => {
  const pages = pageExtensions.map(ext => `pages/**/*.${ext}`);
  const patterns = [...productionEntryFilePatterns, ...pages];
  return [...patterns, ...patterns.map(pattern => `src/${pattern}`)];
};

const production = getEntryFilePatterns();

const resolveFromAST: ResolveFromAST = sourceFile => {
  const pageExtensions = getPageExtensions(sourceFile);
  const extensions = pageExtensions.length > 0 ? pageExtensions : defaultPageExtensions;
  const patterns = getEntryFilePatterns(extensions);
  return patterns.map(id => toProductionEntry(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
} satisfies Plugin;
