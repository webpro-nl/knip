import type { Program } from 'oxc-parser';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { getFirstPropertyValue, getPropertyValues, resolveObjectArg } from '../../typescript/ast-helpers.ts';
import { toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/Paul-Browne/sitelo

const title = 'sitelo';

const enablers = ['sitelo'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['sitelo.config.{js,mjs}'];

const defaultPagesDir = 'src';

const defaultPageExtensions = [
  '.ht.js',
  '.html.js',
  '.ht.ts',
  '.html.ts',
  '.ht.jsx',
  '.html.jsx',
  '.ht.tsx',
  '.html.tsx',
];

const islandsPattern = 'islands/*.{js,mjs,cjs,ts}';

const production = [`${defaultPagesDir}/**/*.{ht,html}.{js,jsx,ts,tsx}`, `${defaultPagesDir}/${islandsPattern}`];

const getConfigObject = (program: Program) => {
  for (const node of (program as unknown as { body: any[] }).body ?? []) {
    if (node.type !== 'ExportDefaultDeclaration') continue;
    const decl = node.declaration;
    return decl?.type === 'CallExpression' ? resolveObjectArg(decl.arguments?.[0]) : resolveObjectArg(decl);
  }
};

const resolveFromAST: ResolveFromAST = (program, options) => {
  const config = getConfigObject(program);
  const root = join(options.configFileDir, getFirstPropertyValue(config, 'root') ?? '.');
  const pagesDir = getFirstPropertyValue(config, 'pagesDir') ?? defaultPagesDir;
  const pageExtensions = getPropertyValues(config, 'pageExtensions');
  const include = getPropertyValues(config, 'include');
  const exclude = getPropertyValues(config, 'exclude');

  const pages =
    include.size > 0
      ? Array.from(include)
      : Array.from(pageExtensions.size > 0 ? pageExtensions : defaultPageExtensions, ext =>
          join(pagesDir, `**/*.${ext.replace(/^\./, '')}`)
        );

  return [
    ...pages.map(pattern => toProductionEntry(join(root, pattern))),
    ...Array.from(exclude, pattern => toProductionEntry(`!${join(root, pattern)}`)),
    toProductionEntry(join(root, pagesDir, islandsPattern)),
  ];
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
