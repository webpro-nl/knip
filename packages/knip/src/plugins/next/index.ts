import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getPageExtensions } from './resolveFromAST.ts';

// https://nextjs.org/docs/getting-started/project-structure

const title = 'Next.js';

const enablers = ['next'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['next.config.{js,ts,cjs,mjs}'];

const defaultPageExtensions = ['{js,jsx,ts,tsx}'];

const productionEntryFilePatterns = [
  '{instrumentation,instrumentation-client,middleware,proxy}.{js,ts}',
  'app/{,[(]*[)]/}{manifest,robots}.{js,ts}',
  'app/**/sitemap.{js,ts}',
  'app/**/{icon,apple-icon,opengraph-image,twitter-image}.{js,jsx,ts,tsx}',
];

const getEntryFilePatterns = (pageExtensions = defaultPageExtensions) => {
  const ext = pageExtensions.length === 1 ? pageExtensions[0] : `{${pageExtensions.join(',')}}`;
  return [
    ...productionEntryFilePatterns,
    `app/global-{error,not-found}.${ext}`,
    `app/**/{default,error,forbidden,loading,not-found,unauthorized}.${ext}`,
    `app/**/{layout,page,route,template}.${ext}`,
    `pages/**/*.${ext}`,
  ].flatMap(pattern => [pattern, `src/${pattern}`]);
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
