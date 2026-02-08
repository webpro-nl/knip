import ts from 'typescript';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { loadFile } from '../../util/fs.js';
import { toDeferResolve, toDependency } from '../../util/input.js';
import { isStartsLikePackageName } from '../../util/modules.js';
import { extname } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { PrettierConfig } from './types.js';

// https://prettier.io/docs/en/configuration.html
// https://github.com/prettier/prettier/blob/main/src/config/prettier-config/config-searcher.js

const title = 'Prettier';

const enablers = ['prettier'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  '.prettierrc',
  '.prettierrc.{json,js,cjs,mjs,ts,cts,mts,yml,yaml,toml,json5}',
  'prettier.config.{js,cjs,mjs,ts,cts,mts}',
  'package.{json,yaml}',
];

const jsLikeExtensions = new Set(['.js', '.cjs', '.mjs', '.ts', '.cts', '.mts']);

const getScriptKind = (ext: string) => {
  if (ext === '.ts' || ext === '.cts' || ext === '.mts') return ts.ScriptKind.TS;
  return ts.ScriptKind.JS;
};

const getReexportedPackageFromEsm = (statement: ts.Statement) => {
  if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) return;
  if (!ts.isStringLiteralLike(statement.moduleSpecifier)) return;
  const specifier = statement.moduleSpecifier.text;
  if (!isStartsLikePackageName(specifier)) return;
  if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) return;
  if (statement.exportClause.elements.length !== 1) return;
  const element = statement.exportClause.elements[0];
  if (element.name.text !== 'default') return;
  if (element.propertyName && element.propertyName.text !== 'default') return;
  return specifier;
};

const getRequireCall = (expression: ts.Expression) => {
  if (ts.isCallExpression(expression)) return expression;
  if (ts.isPropertyAccessExpression(expression) && expression.name.text === 'default') {
    if (ts.isCallExpression(expression.expression)) return expression.expression;
  }
};

const getReexportedPackageFromCjs = (statement: ts.Statement) => {
  if (!ts.isExpressionStatement(statement)) return;
  const expression = statement.expression;
  if (!ts.isBinaryExpression(expression) || expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken) return;
  const left = expression.left;
  if (!ts.isPropertyAccessExpression(left)) return;
  if (!ts.isIdentifier(left.expression) || left.expression.text !== 'module' || left.name.text !== 'exports') return;
  const call = getRequireCall(expression.right);
  if (!call || !ts.isIdentifier(call.expression) || call.expression.text !== 'require') return;
  const [arg] = call.arguments;
  if (!arg || !ts.isStringLiteralLike(arg)) return;
  const specifier = arg.text;
  if (!isStartsLikePackageName(specifier)) return;
  return specifier;
};

const isDirective = (statement: ts.Statement) =>
  ts.isExpressionStatement(statement) && ts.isStringLiteralLike(statement.expression);

const getReexportedPackage = async (configFilePath: string) => {
  const ext = extname(configFilePath);
  if (!jsLikeExtensions.has(ext)) return;

  const contents = await loadFile(configFilePath);
  const sourceFile = ts.createSourceFile(
    configFilePath,
    contents,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(ext)
  );

  let reexportedPackage: string | undefined;

  for (const statement of sourceFile.statements) {
    if (ts.isEmptyStatement(statement) || isDirective(statement)) continue;
    const candidate = getReexportedPackageFromEsm(statement) ?? getReexportedPackageFromCjs(statement);
    if (!candidate) {
      reexportedPackage = undefined;
      break;
    }
    if (reexportedPackage && reexportedPackage !== candidate) {
      reexportedPackage = undefined;
      break;
    }
    reexportedPackage = candidate;
  }

  return reexportedPackage;
};

const resolveConfig: ResolveConfig<PrettierConfig> = async (config, options) => {
  if (typeof config === 'string') return [toDeferResolve(config)];

  if (!Array.isArray(config.plugins)) return [];

  const reexportedPackage = await getReexportedPackage(options.configFilePath);
  if (reexportedPackage) return [];

  return config.plugins.filter((plugin): plugin is string => typeof plugin === 'string').map(id => toDependency(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
