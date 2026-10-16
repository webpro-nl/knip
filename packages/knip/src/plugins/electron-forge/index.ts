import { Visitor } from 'oxc-parser';
import type {
  IsLoadConfig,
  IsPluginEnabled,
  Plugin,
  PluginOptions,
  ResolveConfig,
  ResolveFromAST,
} from '../../types/config.ts';
import { getImportMap, getPropertyKey } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { type Input, toConfig, toDependency, toProductionEntry } from '../../util/input.ts';
import { isAbsolute, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://www.electronforge.io/config/configuration
// https://github.com/electron/forge/blob/v8.0.1/packages/api/core/src/util/forge-config.ts
// https://github.com/electron/forge/blob/v8.0.1/packages/plugin/vite/src/Config.ts
// https://github.com/electron/forge/blob/v8.0.1/packages/plugin/webpack/src/Config.ts

const title = 'Electron Forge';

const enablers = ['@electron-forge/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'config.forge';

const config = ['package.json', 'forge.config.{js,mjs,cjs,ts,mts,cts}'];

const isLoadConfig: IsLoadConfig = ({ configFileName }) => configFileName === 'package.json';

const VITE_PLUGIN = '@electron-forge/plugin-vite';
const WEBPACK_PLUGIN = '@electron-forge/plugin-webpack';

const resolvableKeys = ['makers', 'publishers', 'plugins'];

type Value = Record<string, unknown>;

const isObject = (value: unknown): value is Value =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : value === undefined ? [] : [value]);

const toStrings = (value: unknown): string[] => {
  const values: string[] = [];
  for (const item of isObject(value) ? Object.values(value) : toArray(value)) {
    if (typeof item === 'string') values.push(item);
  }
  return values;
};

const getPluginInputs = (name: unknown, opts: unknown, options: PluginOptions): Input[] => {
  if (!isObject(opts)) return [];
  const { cwd, configFilePath } = options;
  const inputs: Input[] = [];
  const addEntry = (value: unknown) => {
    for (const id of toStrings(value)) inputs.push(toProductionEntry(isAbsolute(id) ? id : join(cwd, id)));
  };
  const addConfig = (pluginName: 'vite' | 'webpack', value: unknown) => {
    if (typeof value === 'string')
      inputs.push(toConfig(pluginName, value, { dir: cwd, containingFilePath: configFilePath }));
  };

  if (name === VITE_PLUGIN) {
    for (const build of toArray(opts.build)) {
      if (!isObject(build)) continue;
      addEntry(build.entry);
      addConfig('vite', build.config);
    }
    for (const renderer of toArray(opts.renderer)) if (isObject(renderer)) addConfig('vite', renderer.config);
  } else if (name === WEBPACK_PLUGIN) {
    addConfig('webpack', opts.mainConfig);
    for (const renderer of toArray(opts.renderer)) {
      if (!isObject(renderer)) continue;
      addConfig('webpack', renderer.config);
      for (const entryPoint of toArray(renderer.entryPoints)) {
        if (!isObject(entryPoint)) continue;
        addEntry(entryPoint.js);
        if (!isObject(entryPoint.preload)) continue;
        addEntry(entryPoint.preload.js);
        addConfig('webpack', entryPoint.preload.config);
      }
    }
  }

  return inputs;
};

const getResolvableInputs = (items: unknown, options: PluginOptions): Input[] => {
  const inputs: Input[] = [];
  for (const item of toArray(items)) {
    if (!isObject(item) || typeof item.name !== 'string') continue;
    inputs.push(toDependency(item.name));
    for (const input of getPluginInputs(item.name, item.config, options)) inputs.push(input);
  }
  return inputs;
};

const resolveConfig: ResolveConfig<unknown> = (localConfig, options) => {
  if (typeof localConfig === 'string') {
    return [toConfig('electron-forge', localConfig, { containingFilePath: options.configFilePath })];
  }
  if (!isObject(localConfig)) return [];
  const inputs: Input[] = [];
  for (const key of resolvableKeys) {
    for (const input of getResolvableInputs(localConfig[key], options)) inputs.push(input);
  }
  return inputs;
};

const toValue = (node: any): unknown => {
  if (node?.type === 'ObjectExpression') {
    const value: Value = {};
    for (const prop of node.properties ?? []) {
      const key = prop.type === 'Property' ? getPropertyKey(prop) : undefined;
      if (key) value[key] = toValue(prop.value);
    }
    return value;
  }
  if (node?.type === 'ArrayExpression') {
    const value: unknown[] = [];
    for (const element of node.elements ?? []) value.push(toValue(element));
    return value;
  }
  return getStringValue(node);
};

const resolveFromAST: ResolveFromAST = (program, options) => {
  const importMap = getImportMap(program);
  const inputs: Input[] = [];
  const visitor = new Visitor({
    Property(node) {
      const key = getPropertyKey(node);
      if (key && resolvableKeys.includes(key) && node.value.type === 'ArrayExpression') {
        for (const input of getResolvableInputs(toValue(node.value), options)) inputs.push(input);
      }
    },
    NewExpression(node) {
      if (node.callee.type !== 'Identifier') return;
      const name = importMap.get(node.callee.name);
      if (name === VITE_PLUGIN || name === WEBPACK_PLUGIN) {
        for (const input of getPluginInputs(name, toValue(node.arguments[0]), options)) inputs.push(input);
      }
    },
  });
  visitor.visit(program);
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  isLoadConfig,
  resolveConfig,
  resolveFromAST,
};

export default plugin;
