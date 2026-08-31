import type { IsPluginEnabled, Plugin, RegisterCompilers, Resolve, ResolveConfig } from '../../types/config.ts';
import { isDirectory, isFile } from '../../util/fs.ts';
import { _syncGlob } from '../../util/glob.ts';
import type { Input } from '../../util/input.ts';
import {
  toAlias,
  toConfig,
  toDeferResolveProductionEntry,
  toDependency,
  toEntry,
  toIgnore,
  toProductionDependency,
  toProductionEntry,
} from '../../util/input.ts';
import { loadTSConfig } from '../../util/load-tsconfig.ts';
import { isInternal, join, toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import {
  buildAutoImportMap,
  collectLocalImportPaths,
  createAutoImportMaps,
  createTsCompiler,
  createVueCompiler,
  readAndParseFile,
} from '../_vue/auto-import.ts';
import type { NuxtConfig } from './types.ts';

const title = 'Nuxt';

const enablers = ['nuxt', 'nuxt-nightly'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['nuxt.config.{js,cjs,mjs,ts,cts,mts}'];

const entry = ['app.config.ts', '**/*.d.vue.ts'];

const app = ['app.{vue,jsx,tsx}', 'error.{vue,jsx,tsx}', 'router.options.ts'];
const layout = (dir = 'layouts') => join(dir, '**/*.{vue,jsx,tsx}');
const middleware = (dir = 'middleware') => join(dir, '**/*.ts');
const pages = (dir = 'pages') => join(dir, '**/*.{vue,jsx,tsx}');
const plugins = (dir = 'plugins') => join(dir, '**/*.ts');
const modules = 'modules/**/*.{ts,vue}';
const server = ['api/**/*.ts', 'middleware/**/*.ts', 'plugins/**/*.ts', 'routes/**/*.ts', 'tasks/**/*.ts'];

const production: string[] = [
  ...app,
  layout(),
  middleware(),
  pages(),
  plugins(),
  modules,
  ...server.map(id => join('server', id)),
];

const setup = async () => {
  if (globalThis && !('defineNuxtConfig' in globalThis)) {
    Object.defineProperty(globalThis, 'defineNuxtConfig', {
      value: (id: any) => id,
      writable: true,
      configurable: true,
    });
  }
};

const resolve: Resolve = () => [
  toIgnore('^#build/', 'unresolved'),
  toIgnore('#components', 'unresolved'),
  toIgnore('#imports', 'unresolved'),
  toIgnore('^#internal/', 'unresolved'),
  toIgnore('#spa-template', 'unresolved'),
];

// Nuxt aliases are unavailable until `nuxt prepare` generates `.nuxt/tsconfig.json`.
const resolveAlias = (specifier: string, srcDir: string, rootDir: string) => {
  if (specifier.startsWith('~~/') || specifier.startsWith('@@/')) return join(rootDir, specifier.slice(3));
  if (specifier.startsWith('~/') || specifier.startsWith('@/')) return join(srcDir, specifier.slice(2));
  return specifier;
};

// Layers from these sources are downloaded by c12, they are not dependencies
const remoteSourcePrefixes = ['gh:', 'github:', 'gitlab:', 'bitbucket:', 'https://', 'http://'];

const toLayerSource = (layer: unknown): unknown => {
  if (typeof layer === 'string') return layer;
  if (Array.isArray(layer)) return layer[0];
  if (layer && typeof layer === 'object' && 'source' in layer) return layer.source;
};

const toLayerSources = (extend: NuxtConfig['extends']) => {
  const sources: string[] = [];
  if (!extend) return sources;
  for (const layer of Array.isArray(extend) ? extend : [extend]) {
    const source = toLayerSource(layer);
    if (typeof source === 'string') sources.push(source);
  }
  return sources;
};

const addAppEntries = (inputs: Input[], srcDir: string, serverDir: string, config: NuxtConfig, dir: string) => {
  for (const id of entry) inputs.push(toEntry(join(srcDir, id)));
  for (const id of app) inputs.push(toProductionEntry(join(srcDir, id)));
  inputs.push(toProductionEntry(join(srcDir, layout(config.dir?.layouts))));
  inputs.push(toProductionEntry(join(srcDir, middleware(config.dir?.middleware))));
  inputs.push(toProductionEntry(join(srcDir, pages(config.dir?.pages))));
  inputs.push(toProductionEntry(join(srcDir, plugins(config.dir?.plugins))));
  inputs.push(toProductionEntry(join(srcDir, 'components/global/**/*.{vue,jsx,tsx}')));
  for (const id of server) inputs.push(toProductionEntry(join(dir, serverDir, id)));
  inputs.push(toProductionEntry(join(dir, modules)));
  if (config.css)
    for (const id of config.css) inputs.push(toDeferResolveProductionEntry(resolveAlias(id, srcDir, dir)));
};

const findLayerConfigs = (cwd: string): string[] => _syncGlob({ cwd, patterns: [`layers/*/${config.at(0)}`] });

const definitionFiles = [
  '.nuxt/imports.d.ts',
  '.nuxt/components.d.ts',
  '.nuxt/types/nitro-routes.d.ts',
  '.nuxt/types/nitro-imports.d.ts',
];

const registerCompilers: RegisterCompilers = async ({ cwd, hasDependency, registerCompiler }) => {
  const paths = definitionFiles.map(file => join(cwd, file));
  const isLayer = paths.some(path => isFile(path));
  if (hasDependency('nuxt') || hasDependency('nuxt-nightly') || isLayer) {
    const maps = createAutoImportMaps();

    for (const path of paths) {
      buildAutoImportMap(path, readAndParseFile(path), maps, path.endsWith('components.d.ts'));
    }

    registerCompiler({ extension: '.vue', compiler: createVueCompiler(maps, cwd) });
    registerCompiler({ extension: '.ts', compiler: createTsCompiler(maps) });
  }
};

const resolveConfig: ResolveConfig<NuxtConfig> = async (localConfig, options) => {
  const { configFileDir: cwd } = options;
  const hasAppDir = isDirectory(cwd, 'app');
  const srcDir = toAbsolute(localConfig.srcDir ?? (hasAppDir ? join(cwd, 'app') : cwd), cwd);
  const serverDir = localConfig.serverDir ?? 'server';
  const inputs: Input[] = [];

  const addModule = (id: string) => {
    const specifier = resolveAlias(id, srcDir, cwd);
    inputs.push(isInternal(specifier) ? toDeferResolveProductionEntry(specifier) : toProductionDependency(specifier));
  };

  for (const id of localConfig.modules ?? []) {
    if (Array.isArray(id) && typeof id[0] === 'string') addModule(id[0]);
    if (typeof id === 'string') addModule(id);
  }

  addAppEntries(inputs, srcDir, serverDir, localConfig, cwd);

  const aliases = localConfig.alias;
  if (aliases) {
    for (const key in aliases) {
      const prefix = resolveAlias(aliases[key], srcDir, cwd);
      inputs.push(toAlias(key, prefix));
      if (prefix.endsWith('/') || isDirectory(prefix)) {
        inputs.push(toAlias(join(key, '*'), join(prefix, '*'), { dir: cwd }));
      }
    }
  }

  for (const source of toLayerSources(localConfig.extends)) {
    if (remoteSourcePrefixes.some(prefix => source.startsWith(prefix))) continue;
    const target = resolveAlias(source, srcDir, cwd);
    const resolved = isInternal(target) ? toAbsolute(target, cwd) : target;
    const configs = _syncGlob({ cwd: resolved, patterns: config });
    if (configs.length > 0) for (const cfg of configs) inputs.push(toConfig('nuxt', cfg));
    else inputs.push(toDependency(source));
  }

  for (const layerConfig of findLayerConfigs(cwd)) {
    inputs.push(toConfig('nuxt', layerConfig));
  }

  if (cwd !== options.cwd) return inputs;

  for (const file of _syncGlob({ cwd, patterns: ['.nuxt/module/*.d.ts'] })) {
    const result = readAndParseFile(file);
    for (const p of collectLocalImportPaths(file, result)) inputs.push(toProductionEntry(p));
  }

  // In case typescript isn't listed
  const dir = join(cwd, '.nuxt');
  const tsConfig = await loadTSConfig(join(dir, 'tsconfig.json'));
  const paths = tsConfig.compilerOptions?.paths;
  if (paths) {
    for (const key in paths) {
      if (key === '#imports' || key === '#components') continue;
      inputs.push(toAlias(key, paths[key], { dir }));
    }
  }

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  setup,
  resolve,
  resolveConfig,
  registerCompilers,
};

export default plugin;
