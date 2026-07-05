import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { isDirectory } from '../../util/fs.ts';
import { toConfig, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getPageExtensions } from './resolveFromAST.ts';

// https://nextjs.org/docs/getting-started/project-structure

const title = 'Next.js';

const enablers = ['next'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['next.config.{js,ts,cjs,mjs}'];

const defaultPageExtensions = ['{js,jsx,ts,tsx}'];

const productionEntryFilePatterns = [
  'app/{,[(]*[)]/}{manifest,robots}.{js,ts}',
  'app/**/sitemap.{js,ts}',
  'app/**/{icon,apple-icon,opengraph-image,twitter-image}.{js,jsx,ts,tsx}',
];

const getEntryFilePatterns = (pageExtensions = defaultPageExtensions, cwd?: string) => {
  const ext = pageExtensions.length === 1 ? pageExtensions[0] : `{${pageExtensions.join(',')}}`;
  const patterns = [
    ...productionEntryFilePatterns,
    `{instrumentation,instrumentation-client,middleware,proxy}.${ext}`,
    `app/global-{error,not-found}.${ext}`,
    `app/**/{default,error,forbidden,loading,not-found,unauthorized}.${ext}`,
    `app/**/{layout,page,route,template}.${ext}`,
    `pages/**/*.${ext}`,
  ];
  if (cwd) {
    if (isDirectory(cwd, 'pages') || isDirectory(cwd, 'app')) return patterns;
    if (isDirectory(cwd, 'src/pages') || isDirectory(cwd, 'src/app')) return patterns.map(pattern => `src/${pattern}`);
  }
  return patterns.flatMap(pattern => [pattern, `src/${pattern}`]);
};

const production = getEntryFilePatterns();

const resolveFromAST: ResolveFromAST = (program, { configFileDir }) => {
  const pageExtensions = getPageExtensions(program);
  const extensions = pageExtensions.length > 0 ? pageExtensions : defaultPageExtensions;
  const patterns = [...getEntryFilePatterns(extensions, configFileDir), 'next-env.d.ts'];
  return patterns.map(id => toProductionEntry(join(configFileDir, id)));
};

const commands = new Set(['dev', 'build', 'start']);

const args: Args = {
  boolean: ['turbo', 'turbopack'],
  resolveInputs: parsed => {
    const dir = commands.has(parsed._[0]) ? parsed._[1] : undefined;
    if (!dir) return [];
    return [toConfig('next', join(dir, 'next.config'))];
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
  args,
};

export default plugin;
