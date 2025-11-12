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
  '{instrumentation,instrumentation-client,middleware,proxy}.{js,ts}',
  'app/{manifest,robots}.{js,ts}',
  'app/**/sitemap.{js,ts}',
  'app/**/{icon,apple-icon}.{js,jsx,ts,tsx}',
  'app/**/{opengraph,twitter}-image.{js,jsx,ts,tsx}',
  'mdx-components.{js,jsx,ts,tsx}',
];

const getEntryFilePatterns = (pageExtensions = defaultPageExtensions) => {
  const patterns = [...productionEntryFilePatterns];
  for (const ext of pageExtensions) {
    patterns.push(
      `app/global-{error,not-found}.${ext}`,
      `app/**/{error,layout,loading,not-found,page,template,default,forbidden,unauthorized}.${ext}`,
      `app/**/route.${ext}`,
      `pages/**/*.${ext}`
    );
  }
  return [...patterns, ...patterns.map(pattern => `src/${pattern}`)];
};

const production = getEntryFilePatterns();

const resolveFromAST: ResolveFromAST = sourceFile => {
  const pageExtensions = getPageExtensions(sourceFile);
  const extensions = pageExtensions.length > 0 ? pageExtensions : defaultPageExtensions;
  const patterns = getEntryFilePatterns(extensions);
  return patterns.map(id => toProductionEntry(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;
