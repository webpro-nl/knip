import { type Expression, type Program, type SpreadElement, Visitor } from 'oxc-parser';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { findProperty, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { _parseFile, getStringValue } from '../../typescript/ast-nodes.ts';
import { isDirectory } from '../../util/fs.ts';
import { toConfig, toDeferResolve, toProductionEntry } from '../../util/input.ts';
import { isInNodeModules, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { _resolveModuleSync } from '../../util/resolve.ts';

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

const getFactoryBody = (program: Program, name: string, isExport = false): Program['body'] => {
  if (isExport) {
    for (const node of program.body) {
      if (node.type === 'ExportDefaultDeclaration' && name === 'default') {
        const declaration = node.declaration;
        if (declaration.type === 'Identifier') return getFactoryBody(program, declaration.name);
        if (declaration.type === 'FunctionDeclaration') return [declaration];
        if (declaration.type === 'ArrowFunctionExpression' || declaration.type === 'FunctionExpression') {
          return [{ type: 'ExpressionStatement', expression: declaration, start: node.start, end: node.end }];
        }
      }
      if (node.type === 'ExportNamedDeclaration' && !node.source) {
        for (const specifier of node.specifiers) {
          const exported =
            specifier.exported.type === 'Identifier' ? specifier.exported.name : specifier.exported.value;
          const local = specifier.local.type === 'Identifier' ? specifier.local.name : specifier.local.value;
          if (exported === name) return getFactoryBody(program, local);
        }
      }
    }
  }
  for (const node of program.body) {
    const declaration = node.type === 'ExportNamedDeclaration' ? node.declaration : node;
    if (declaration?.type === 'FunctionDeclaration' && declaration.id?.name === name) return [declaration];
    if (declaration?.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === 'Identifier' && declarator.id.name === name) {
          return [{ ...declaration, declarations: [declarator] }];
        }
      }
    }
  }
  return [];
};

const resolveFromAST: ResolveFromAST = (program, { configFileDir, configFilePath, readFile }) => {
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

  const programs = new Map([[configFilePath, program]]);
  const seen = new Map<string, Set<string>>();
  const visitConfig = (program: Program, filePath: string, factory?: string, isExport = false) => {
    const visited = seen.get(filePath) ?? new Set<string>();
    const key = `${isExport ? 'export' : 'local'}:${factory}`;
    if (visited.has(key)) return;
    visited.add(key);
    seen.set(filePath, visited);
    const references = new Set<string>();
    const visitor = new Visitor({
      CallExpression(node) {
        if (node.callee.type === 'Identifier') references.add(node.callee.name);
      },
      ReturnStatement(node) {
        if (node.argument?.type === 'Identifier') references.add(node.argument.name);
      },
      SpreadElement(node) {
        if (node.argument.type === 'Identifier') references.add(node.argument.name);
      },
      ArrowFunctionExpression(node) {
        if (node.body.type === 'Identifier') references.add(node.body.name);
      },
      ObjectExpression(node) {
        const turbopack = findProperty(node, 'turbopack');
        if (!factory) {
          for (const extension of getPropertyValues(node, 'pageExtensions')) pageExtensions.add(extension);
          if (turbopack?.type === 'ConditionalExpression') {
            collectTurbopackAliases(turbopack.consequent);
            collectTurbopackAliases(turbopack.alternate);
          } else {
            collectTurbopackAliases(turbopack);
          }
        }
        const rules = findProperty(turbopack, 'rules');
        if (rules?.type !== 'ObjectExpression') return;
        for (const rule of rules.properties) {
          if (rule.type === 'Property') collectLoaders(rule.value);
        }
      },
    });
    visitor.visit(factory ? { ...program, body: getFactoryBody(program, factory, isExport) } : program);
    for (const reference of references) {
      if (getFactoryBody(program, reference).length > 0) visitConfig(program, filePath, reference);
    }
    for (const node of program.body) {
      if (node.type !== 'ImportDeclaration' || node.importKind === 'type') continue;
      for (const specifier of node.specifiers) {
        if (!references.has(specifier.local.name)) continue;
        if (specifier.type === 'ImportNamespaceSpecifier') continue;
        if (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type') continue;
        const imported = specifier.type === 'ImportSpecifier' ? specifier.imported : undefined;
        const name = imported?.type === 'Identifier' ? imported.name : imported?.value;
        const factory = specifier.type === 'ImportDefaultSpecifier' ? 'default' : name;
        if (!factory) continue;
        const resolved = _resolveModuleSync(node.source.value, filePath);
        if (!resolved || isInNodeModules(resolved)) continue;
        const cached = programs.get(resolved);
        if (cached) {
          visitConfig(cached, resolved, factory, true);
        } else {
          const sourceText = readFile(resolved);
          if (!sourceText) continue;
          const parsed = _parseFile(resolved, sourceText).program;
          programs.set(resolved, parsed);
          visitConfig(parsed, resolved, factory, true);
        }
      }
    }
  };
  visitConfig(program, configFilePath);

  const extensions = pageExtensions.size > 0 ? [...pageExtensions] : defaultPageExtensions;
  const patterns = [...getEntryFilePatterns(extensions, configFileDir), 'next-env.d.ts'];
  const inputs = patterns.map(id => toProductionEntry(join(configFileDir, id)));
  for (const loader of loaders) inputs.push(toDeferResolve(loader));
  for (const target of aliasTargets)
    inputs.push({ ...toDeferResolve(target, { dir: configFileDir }), production: true });
  return inputs;
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
