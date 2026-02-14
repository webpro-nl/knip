import type { IsPluginEnabled, Plugin, RegisterCompilers, ResolveConfig } from '../../types/config.js';
import { isDirectory } from '../../util/fs.js';
import { _syncGlob } from '../../util/glob.js';
import type { Input } from '../../util/input.js';
import {
  toAlias,
  toConfig,
  toDeferResolveProductionEntry,
  toDependency,
  toEntry,
  toIgnore,
  toProductionEntry,
} from '../../util/input.js';
import { loadTSConfig } from '../../util/load-tsconfig.js';
import { isAbsolute, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import {
  buildAutoImportMap,
  collectIdentifiers,
  collectLocalImportPaths,
  collectTemplateInfo,
  createSourceFile,
  getVueSfc,
  toKebabCase,
} from './helpers.js';
import type { NuxtConfig } from './types.js';

const title = 'Nuxt';

const enablers = ['nuxt', 'nuxt-nightly'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['nuxt.config.{js,mjs,ts}'];

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

// Workaround to pre-resolve specifiers from root, as no tsconfig.json/project references covers
const resolveAlias = (specifier: string, srcDir: string, rootDir: string) => {
  if (specifier.startsWith('~~/') || specifier.startsWith('@@/')) return join(rootDir, specifier.slice(3));
  if (specifier.startsWith('~/') || specifier.startsWith('@/')) return join(srcDir, specifier.slice(2));
  return specifier;
};

const addAppEntries = (inputs: Input[], srcDir: string, serverDir: string, config: NuxtConfig, dir: string) => {
  for (const id of entry) inputs.push(toEntry(join(srcDir, id)));
  for (const id of app) inputs.push(toProductionEntry(join(srcDir, id)));
  inputs.push(toProductionEntry(join(srcDir, layout(config.dir?.layouts))));
  inputs.push(toProductionEntry(join(srcDir, middleware(config.dir?.middleware))));
  inputs.push(toProductionEntry(join(srcDir, pages(config.dir?.pages))));
  inputs.push(toProductionEntry(join(srcDir, plugins(config.dir?.plugins))));
  for (const id of server) inputs.push(toProductionEntry(join(dir, serverDir, id)));
  inputs.push(toProductionEntry(join(dir, modules)));
  if (config.css) {
    for (const id of config.css) {
      if (isAbsolute(id)) inputs.push(toProductionEntry(id));
      else inputs.push(toDeferResolveProductionEntry(resolveAlias(id, srcDir, dir)));
    }
  }
};

const findLayerConfigs = (cwd: string): string[] => _syncGlob({ cwd, patterns: [`layers/*/${config.at(0)}`] });

const registerCompilers: RegisterCompilers = async ({ cwd, hasDependency, registerCompiler }) => {
  if (hasDependency('nuxt') || hasDependency('nuxt-nightly')) {
    const vueSfc = getVueSfc(cwd);

    const importMap = new Map<string, string>();
    const componentMap = new Map<string, string[]>();

    const definitionFiles = [
      '.nuxt/imports.d.ts',
      '.nuxt/components.d.ts',
      '.nuxt/types/nitro-routes.d.ts',
      '.nuxt/types/nitro-imports.d.ts',
    ];

    for (const file of definitionFiles) {
      const sourceFile = createSourceFile(join(cwd, file));
      const maps = buildAutoImportMap(sourceFile);
      for (const [id, specifier] of maps.importMap) importMap.set(id, specifier);
      for (const [id, components] of maps.componentMap) {
        const store = componentMap.get(id);
        if (store) store.push(...components);
        else componentMap.set(id, [...components]);
      }
    }

    const getSyntheticImports = (identifiers: Set<string>, templateTags?: Set<string>) => {
      const syntheticImports: string[] = [];

      for (const [name, specifier] of importMap) {
        if (identifiers.has(name)) syntheticImports.push(`import { ${name} } from '${specifier}';`);
      }

      if (templateTags) {
        for (const [name, specifiers] of componentMap) {
          if (templateTags.has(name) || templateTags.has(toKebabCase(name))) {
            syntheticImports.push(`import { default as ${name} } from '${specifiers[0]}';`);
            for (let i = 1; i < specifiers.length; i++) syntheticImports.push(`import '${specifiers[i]}';`);
          }
        }
      }

      return syntheticImports;
    };

    const compiler = (source: string, path: string) => {
      const { descriptor } = vueSfc.parse(source, path);
      const scripts: string[] = [];

      if (descriptor.script?.content) scripts.push(descriptor.script.content);
      if (descriptor.scriptSetup?.content) scripts.push(descriptor.scriptSetup.content);

      const identifiers = collectIdentifiers(scripts.join('\n'), path);
      let templateTags: Set<string> | undefined;
      if (descriptor.template?.ast) {
        const info = collectTemplateInfo(descriptor.template.ast);
        templateTags = info.tags;
        for (const id of info.identifiers) identifiers.add(id);
      }
      const synthetic = getSyntheticImports(identifiers, templateTags);
      scripts.push(...synthetic);

      return scripts.join(';\n');
    };

    const tsCompiler = (source: string, path: string) => {
      // TODO Can we filter out more files that are outside the realm of auto-imports?
      if (path.endsWith('.d.ts') || path.endsWith('.config.ts')) return source;
      const identifiers = collectIdentifiers(source, path);
      const syntheticImports = getSyntheticImports(identifiers);
      if (syntheticImports.length === 0) return source;
      return `${syntheticImports.join('\n')}\n${source}`;
    };

    registerCompiler({ extension: '.vue', compiler });
    registerCompiler({ extension: '.ts', compiler: tsCompiler });
  }
};

const resolveConfig: ResolveConfig<NuxtConfig> = async (localConfig, options) => {
  const { configFileDir: cwd } = options;
  const hasAppDir = isDirectory(cwd, 'app');
  const srcDir = localConfig.srcDir ?? (hasAppDir ? join(cwd, 'app') : cwd);
  const serverDir = localConfig.serverDir ?? 'server';
  const inputs: Input[] = [];

  for (const id of localConfig.modules ?? []) {
    if (Array.isArray(id) && typeof id[0] === 'string') inputs.push(toDependency(id[0]));
    if (typeof id === 'string') inputs.push(toDependency(id));
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

  for (const layerConfig of findLayerConfigs(cwd)) {
    inputs.push(toConfig('nuxt', layerConfig));
  }

  if (cwd !== options.cwd) return inputs;

  for (const file of _syncGlob({ cwd, patterns: ['.nuxt/module/*.d.ts'] })) {
    const sourceFile = createSourceFile(join(cwd, file));
    for (const path of collectLocalImportPaths(sourceFile)) inputs.push(toProductionEntry(path));
  }

  const dir = join(cwd, '.nuxt');
  const config = await loadTSConfig(join(dir, 'tsconfig.json'));
  const paths = config.compilerOptions?.paths;
  if (paths) {
    for (const key in paths) {
      if (key === '#imports' || key === '#components') continue;
      inputs.push(toAlias(key, paths[key], { dir }));
    }
  }

  inputs.push(toIgnore('#imports', 'unresolved'));
  inputs.push(toIgnore('#components', 'unresolved'));

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
  resolveConfig,
  registerCompilers,
};

export default plugin;
