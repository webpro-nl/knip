import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { isDirectory } from '../../util/fs.ts';
import { toConfig, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://nextjs.org/docs/getting-started/project-structure

const title = 'Next.js';

const enablers = ['next'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['next.config.{js,ts,cjs,mjs,mts}'];

const defaultPageExtensions = ['{js,jsx,ts,tsx}'];

const productionEntryFilePatterns = [
  'app/{,[(]*[)]/}{manifest,robots}.{js,ts}',
  'app/**/sitemap.{js,ts}',
  'app/**/{icon,apple-icon,opengraph-image,twitter-image}.{js,jsx,ts,tsx}',
];

const rootOrSrc = '{,src/}';

// Next.js resolves the pages and app directories independently: the root dir wins, src/ is used when it's absent
// (up to v15 the two can live in different locations, e.g. root pages/ with src/app; v16 requires the same parent)
// https://nextjs.org/docs/app/api-reference/file-conventions/src-folder
const getRouterDirPrefix = (cwd: string | undefined, name: 'pages' | 'app') => {
  if (!cwd) return rootOrSrc;
  if (isDirectory(cwd, name)) return '';
  if (isDirectory(cwd, `src/${name}`)) return 'src/';
  return rootOrSrc;
};

const getEntryFilePatterns = (pageExtensions = defaultPageExtensions, cwd?: string) => {
  const ext = pageExtensions.length === 1 ? pageExtensions[0] : `{${pageExtensions.join(',')}}`;
  const appDirPrefix = getRouterDirPrefix(cwd, 'app');
  const pagesDirPrefix = getRouterDirPrefix(cwd, 'pages');
  return [
    ...productionEntryFilePatterns.map(pattern => `${appDirPrefix}${pattern}`),
    `${rootOrSrc}{instrumentation,instrumentation-client,middleware,proxy}.${ext}`,
    `${appDirPrefix}app/global-{error,not-found}.${ext}`,
    `${appDirPrefix}app/**/{default,error,forbidden,loading,not-found,unauthorized}.${ext}`,
    `${appDirPrefix}app/**/{layout,page,route,template}.${ext}`,
    `${pagesDirPrefix}pages/**/*.${ext}`,
  ];
};

const production = getEntryFilePatterns();

const resolveFromAST: ResolveFromAST = (program, { configFileDir }) => {
  const pageExtensions = [...collectPropertyValues(program, 'pageExtensions')];
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
