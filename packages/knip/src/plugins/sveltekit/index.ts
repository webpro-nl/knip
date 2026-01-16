import ts from 'typescript';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.js';
import { findDescendants, stripQuotes } from '../../typescript/ast-helpers.js';
import { toAlias, toIgnore, toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';

// https://svelte.dev/docs/kit

const title = 'SvelteKit';

const enablers = ['@sveltejs/kit'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['svelte.config.js'];

const production = [
  'src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}',
  'src/hooks.{server,client}.{js,ts}',
  'src/params/*.{js,ts}',
  'src/service-worker.{js,ts}',
  'src/service-worker/index.{js,ts}',
  'src/instrumentation.server.{js,ts}',
];

const getLibPath = (sourceFile: ts.SourceFile): string => {
  const assignments = findDescendants<ts.PropertyAssignment>(sourceFile, node => ts.isPropertyAssignment(node));

  for (const assignment of assignments) {
    if (assignment.name.getText() === 'lib' && ts.isStringLiteral(assignment.initializer)) {
      return stripQuotes(assignment.initializer.getText());
    }
  }

  return 'src/lib';
};

const resolveFromAST: ResolveFromAST = sourceFile => {
  const lib = getLibPath(sourceFile);
  return [
    ...production.map(pattern => toProductionEntry(pattern)),
    toAlias('$lib', [`./${lib}`]),
    toAlias('$lib/*', [`./${lib}/*`]),
    toIgnore('\\$app/.+', 'unresolved'),
    toIgnore('\\$env/.+', 'unresolved'),
    toIgnore('\\$service-worker', 'unresolved'),
  ];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
};

export default plugin;
