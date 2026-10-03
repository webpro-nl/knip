import type { Expression, ObjectExpression, Program, SpreadElement } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import type { IsLoadConfig, IsPluginEnabled, Plugin, ResolveConfig, ResolveFromAST } from '../../types/config.ts';
import { findProperty, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { _parseFile } from '../../typescript/ast-nodes.ts';
import { type Input, toConfig, toDependency, toEntry } from '../../util/input.ts';
import { dirname, isInternal, toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { _resolveModuleSync } from '../../util/resolve.ts';
import { getInputsFromSettings } from '../eslint/helpers.ts';
import { getInputsFromSettingsAST } from '../eslint/resolveFromAST.ts';
import type { OxlintConfig } from './types.ts';

// https://oxc.rs/docs/guide/usage/linter/config.html

const title = 'Oxlint';

const enablers = ['oxlint', 'vite-plus'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.oxlintrc.{json,jsonc}', 'oxlint.config.{ts,mts}', 'vite.config.{js,mjs,ts,cjs,mts,cts}'];

const isViteConfig = (configFileName: string) => configFileName.startsWith('vite.config.');

const args = {
  config: true,
};

const resolveJsPlugins = (jsPlugins: OxlintConfig['jsPlugins'], configFilePath: string): Input[] => {
  const inputs: Input[] = [];
  const dir = dirname(configFilePath);
  for (const plugin of jsPlugins ?? []) {
    const specifier = typeof plugin === 'string' ? plugin : plugin.specifier;
    if (!isInternal(specifier)) inputs.push(toDependency(specifier));
    else inputs.push(toEntry(toAbsolute(specifier, dir)));
  }
  return inputs;
};

const isLoadConfig: IsLoadConfig = ({ configFileName }) => !isViteConfig(configFileName);

const resolveExtendedConfig = (config: OxlintConfig, configFilePath: string): Input[] => {
  const inputs: Input[] = [];
  for (const entry of config.extends ?? []) {
    if (typeof entry === 'string') {
      const filePath = toAbsolute(entry, dirname(configFilePath));
      inputs.push(toConfig('oxlint', filePath, { containingFilePath: configFilePath }));
    } else {
      for (const input of resolveExtendedConfig(entry, configFilePath)) inputs.push(input);
    }
  }
  for (const input of resolveJsPlugins(config.jsPlugins, configFilePath)) inputs.push(input);
  for (const override of config.overrides ?? []) {
    for (const input of resolveJsPlugins(override.jsPlugins, configFilePath)) inputs.push(input);
  }
  for (const input of getInputsFromSettings(config.settings)) inputs.push(input);
  return inputs;
};

const resolveConfig: ResolveConfig<OxlintConfig> = (config, options) =>
  resolveExtendedConfig(config, options.configFilePath);

type Node = Expression | SpreadElement | null | undefined;

type Body = Program['body'];

const unwrap = (node: Node): Node =>
  node?.type === 'TSSatisfiesExpression' || node?.type === 'TSAsExpression' ? unwrap(node.expression) : node;

const findObject = (body: Body, name: string) => {
  for (const statement of body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type !== 'VariableDeclaration') continue;
    for (const declarator of declaration.declarations) {
      if (declarator.id.type !== 'Identifier' || declarator.id.name !== name) continue;
      const init = unwrap(declarator.init);
      if (init?.type === 'ObjectExpression') return init;
    }
  }
};

const findImport = (body: Body, name: string) => {
  for (const statement of body) {
    if (statement.type !== 'ImportDeclaration' || !isInternal(statement.source.value)) continue;
    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier' || specifier.local.name !== name) continue;
      if (specifier.imported.type !== 'Identifier') return;
      return { specifier: statement.source.value, name: specifier.imported.name };
    }
  }
};

const resolveFromAST: ResolveFromAST = (program, options) => {
  if (!isViteConfig(options.configFileName)) return [];
  const jsPlugins = new Set<string>();
  const seen = new Set<ObjectExpression>();
  const modules = new Map<string, Body>();

  const getBody = (filePath: string) => {
    let body = modules.get(filePath);
    if (!body) {
      body = _parseFile(filePath, options.readFile(filePath)).program.body;
      modules.set(filePath, body);
    }
    return body;
  };

  const addJsPlugins = (config: ObjectExpression) => {
    for (const specifier of getPropertyValues(config, 'jsPlugins')) jsPlugins.add(specifier);
    for (const plugin of findProperty(config, 'jsPlugins')?.elements ?? []) {
      if (plugin?.type !== 'ObjectExpression') continue;
      for (const specifier of getPropertyValues(plugin, 'specifier')) jsPlugins.add(specifier);
    }
  };

  const addConfig = (node: Node, body: Body): void => {
    const value = unwrap(node);
    if (value?.type === 'Identifier') {
      const local = findObject(body, value.name);
      if (local) return addConfig(local, body);
      const imported = body === program.body ? findImport(body, value.name) : undefined;
      if (!imported) return;
      const filePath = _resolveModuleSync(imported.specifier, options.configFilePath);
      if (!filePath) return;
      const importedBody = getBody(filePath);
      return addConfig(findObject(importedBody, imported.name), importedBody);
    }
    if (value?.type !== 'ObjectExpression' || seen.has(value)) return;
    seen.add(value);
    addJsPlugins(value);
    for (const property of value.properties) {
      if (property.type === 'SpreadElement') addConfig(property.argument, body);
    }
    for (const override of findProperty(value, 'overrides')?.elements ?? []) addConfig(override, body);
  };

  const visitor = new Visitor({
    ObjectExpression(node) {
      addConfig(findProperty(node, 'lint'), program.body);
    },
  });
  visitor.visit(program);
  return [...resolveJsPlugins([...jsPlugins], options.configFilePath), ...getInputsFromSettingsAST(program)];
};

const isFilterTransitiveDependencies = true;

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  isLoadConfig,
  resolveConfig,
  resolveFromAST,
  isFilterTransitiveDependencies,
  args,
};

export default plugin;
