import { type Expression, type SpreadElement, Visitor } from 'oxc-parser';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveFromAST } from '../../types/config.ts';
import { findProperty, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { isDirectory } from '../../util/fs.ts';
import { toConfig, toDeferResolve, toProductionEntry } from '../../util/input.ts';
import { isInNodeModules, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { NextConfigModule } from './types.ts';

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

const getInputs = (
  pageExtensions: string[],
  loaders: Iterable<string>,
  aliasTargets: Iterable<string>,
  configFileDir: string
) => {
  const extensions = pageExtensions.length > 0 ? pageExtensions : defaultPageExtensions;
  const patterns = [...getEntryFilePatterns(extensions, configFileDir), 'next-env.d.ts'];
  const inputs = patterns.map(id => toProductionEntry(join(configFileDir, id)));
  for (const loader of loaders) inputs.push(toDeferResolve(loader));
  for (const target of aliasTargets)
    inputs.push({ ...toDeferResolve(target, { dir: configFileDir }), production: true });
  return inputs;
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// Absolute paths come from `require.resolve()` in the config, which core credits to the module that resolved them
const addSpecifier = (specifiers: Set<string>, value: unknown) => {
  if (typeof value === 'string' && !isInNodeModules(value)) specifiers.add(value);
};

const collectLoaderValues = (value: unknown, loaders: Set<string>) => {
  if (Array.isArray(value)) for (const item of value) collectLoaderValues(item, loaders);
  else if (isObject(value)) {
    addSpecifier(loaders, value.loader);
    collectLoaderValues(value.loaders, loaders);
  } else addSpecifier(loaders, value);
};

const collectAliasTargetValues = (value: unknown, targets: Set<string>) => {
  if (Array.isArray(value)) for (const item of value) collectAliasTargetValues(item, targets);
  else if (isObject(value)) collectAliasTargetValues(value.browser, targets);
  else addSpecifier(targets, value);
};

const resolveConfig: ResolveConfig<NextConfigModule> = async (localConfig, { configFileDir }) => {
  const config =
    typeof localConfig === 'function'
      ? await localConfig('phase-production-build', { defaultConfig: {} })
      : localConfig;
  const pageExtensions = Array.isArray(config?.pageExtensions)
    ? config.pageExtensions.filter(extension => typeof extension === 'string')
    : [];
  const loaders = new Set<string>();
  for (const rule of Object.values(config?.turbopack?.rules ?? {})) collectLoaderValues(rule, loaders);
  const aliasTargets = new Set<string>();
  for (const target of Object.values(config?.turbopack?.resolveAlias ?? {}))
    collectAliasTargetValues(target, aliasTargets);
  return getInputs(pageExtensions, loaders, aliasTargets, configFileDir);
};

const resolveFromAST: ResolveFromAST = (program, { configFileDir }) => {
  const pageExtensions = new Set<string>();
  const loaders = new Set<string>();
  const aliasTargets = new Set<string>();
  const collectAliasTargets = (node: Expression | SpreadElement | null) => {
    const target = getStringValue(node);
    if (target) aliasTargets.add(target);
    else if (node?.type === 'ArrayExpression') {
      for (const element of node.elements) collectAliasTargets(element);
    } else if (node?.type === 'ObjectExpression') {
      collectAliasTargets(findProperty(node, 'browser'));
    }
  };
  const collectTurbopackAliases = (node: Expression | SpreadElement | null) => {
    const aliases = findProperty(node, 'resolveAlias');
    if (aliases?.type !== 'ObjectExpression') return;
    for (const alias of aliases.properties) {
      if (alias.type === 'Property') collectAliasTargets(alias.value);
    }
  };
  const collectLoaders = (node: Expression | SpreadElement | null) => {
    if (node?.type === 'ArrayExpression') {
      for (const element of node.elements) collectLoaders(element);
    } else {
      const loader = getStringValue(node) ?? getStringValue(findProperty(node, 'loader'));
      if (loader) loaders.add(loader);
      const nested = findProperty(node, 'loaders');
      if (nested?.type === 'ArrayExpression') collectLoaders(nested);
    }
  };

  const visitor = new Visitor({
    ObjectExpression(node) {
      for (const extension of getPropertyValues(node, 'pageExtensions')) pageExtensions.add(extension);
      const turbopack = findProperty(node, 'turbopack');
      if (turbopack?.type === 'ConditionalExpression') {
        collectTurbopackAliases(turbopack.consequent);
        collectTurbopackAliases(turbopack.alternate);
      } else {
        collectTurbopackAliases(turbopack);
      }
      const rules = findProperty(turbopack, 'rules');
      if (rules?.type !== 'ObjectExpression') return;
      for (const rule of rules.properties) {
        if (rule.type === 'Property') collectLoaders(rule.value);
      }
    },
  });
  visitor.visit(program);

  return getInputs([...pageExtensions], loaders, aliasTargets, configFileDir);
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

const note = `Knip loads \`next.config.*\` to read Turbopack loaders and alias targets from the composed configuration,
including values a shared configuration factory adds. A configuration file that fails to load is analyzed statically.`;

/** @public */
export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  isLoadConfigOptional: true,
  resolveConfig,
  resolveFromAST,
  args,
};

export default plugin;
