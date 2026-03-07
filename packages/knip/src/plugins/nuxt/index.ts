import type {
  IsPluginEnabled,
  Plugin,
  PluginOptions,
  RegisterCompilers,
  ResolveConfig,
} from '../../types/config.ts';
import { debugLog } from '../../util/debug.ts';
import { isDirectory } from '../../util/fs.ts';
import { _syncGlob } from '../../util/glob.ts';
import type { Input } from '../../util/input.ts';
import {
  toAlias,
  toConfig,
  toDeferResolveProductionEntry,
  toDependency,
  toEntry,
  toIgnore,
  toProductionEntry,
} from '../../util/input.ts';
import { loadTSConfig } from '../../util/load-tsconfig.ts';
import { isAbsolute, join, resolve } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import {
  buildAutoImportMap,
  collectIdentifiers,
  collectLocalImportPaths,
  collectTemplateInfo,
  createSourceFile,
  getVueSfc,
  toKebabCase,
} from './helpers.ts';
import type { NuxtConfig } from './types.ts';

const title = 'Nuxt';

const enablers = ['nuxt', 'nuxt-nightly'];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const config = ['nuxt.config.{js,mjs,ts}'];

const entry = ['app.config.ts', '**/*.d.vue.ts'];

const app = ['app.{vue,jsx,tsx}', 'error.{vue,jsx,tsx}', 'router.options.ts'];
const layout = (dir = 'layouts') => join(dir, '**/*.{vue,jsx,tsx}');
const middleware = (dir = 'middleware') => join(dir, '**/*.ts');
const pages = (dir = 'pages') => join(dir, '**/*.{vue,jsx,tsx}');
const plugins = (dir = 'plugins') => join(dir, '**/*.ts');
const modules = 'modules/**/*.{ts,vue}';
const server = [
  'api/**/*.ts',
  'middleware/**/*.ts',
  'plugins/**/*.ts',
  'routes/**/*.ts',
  'tasks/**/*.ts',
];

const production: string[] = [
  ...app,
  layout(),
  middleware(),
  pages(),
  plugins(),
  modules,
  ...server.map((id) => join('server', id)),
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

const registerCompilers: RegisterCompilers = async ({
  cwd,
  hasDependency,
  registerCompiler,
}) => {
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
      for (const [id, specifier] of maps.importMap)
        importMap.set(id, specifier);
      for (const [id, components] of maps.componentMap) {
        const store = componentMap.get(id);
        if (store) store.push(...components);
        else componentMap.set(id, [...components]);
      }
    }

    const getSyntheticImports = (
      identifiers: Set<string>,
      templateTags?: Set<string>,
    ) => {
      const syntheticImports: string[] = [];

      for (const [name, specifier] of importMap) {
        if (identifiers.has(name))
          syntheticImports.push(`import { ${name} } from '${specifier}';`);
      }

      if (templateTags) {
        for (const [name, specifiers] of componentMap) {
          const kebab = toKebabCase(name);
          if (
            templateTags.has(name) ||
            templateTags.has(kebab) ||
            templateTags.has(`Lazy${name}`) ||
            templateTags.has(`lazy-${kebab}`)
          ) {
            syntheticImports.push(
              `import { default as ${name} } from '${specifiers[0]}';`,
            );
            for (let i = 1; i < specifiers.length; i++)
              syntheticImports.push(`import '${specifiers[i]}';`);
          }
        }
      }

      return syntheticImports;
    };

    const compiler = (source: string, path: string) => {
      const { descriptor } = vueSfc.parse(source, path);
      const scripts: string[] = [];

      if (descriptor.script?.content) scripts.push(descriptor.script.content);
      if (descriptor.scriptSetup?.content)
        scripts.push(descriptor.scriptSetup.content);

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
      if (path.endsWith('.d.ts') || path.endsWith('.config.ts')) return source;
      const identifiers = collectIdentifiers(source, path);
      const syntheticImports = getSyntheticImports(identifiers);
      if (syntheticImports.length === 0) return source;
      return `${source}\n${syntheticImports.join('\n')}`;
    };

    registerCompiler({ extension: '.vue', compiler });
    registerCompiler({ extension: '.ts', compiler: tsCompiler });
  }
};

// Workaround to pre-resolve specifiers from root, as no tsconfig.json/project references covers
const _resolveAlias = (specifier: string, srcDir: string, rootDir: string) => {
  if (specifier.startsWith('~~/') || specifier.startsWith('@@/'))
    return join(rootDir, specifier.slice(3));
  if (specifier.startsWith('~/') || specifier.startsWith('@/'))
    return join(srcDir, specifier.slice(2));
  return specifier;
};

const addAppEntries = (
  inputs: Input[],
  srcDir: string,
  serverDir: string,
  config: NuxtConfig,
  dir: string,
) => {
  for (const id of entry) inputs.push(toEntry(join(srcDir, id)));
  for (const id of app) inputs.push(toProductionEntry(join(srcDir, id)));
  inputs.push(toProductionEntry(join(srcDir, layout(config.dir?.layouts))));
  inputs.push(
    toProductionEntry(join(srcDir, middleware(config.dir?.middleware))),
  );
  inputs.push(toProductionEntry(join(srcDir, pages(config.dir?.pages))));
  inputs.push(toProductionEntry(join(srcDir, plugins(config.dir?.plugins))));
  inputs.push(
    toProductionEntry(join(srcDir, 'components/global/**/*.{vue,jsx,tsx}')),
  );
  for (const id of server)
    inputs.push(toProductionEntry(join(dir, serverDir, id)));
  inputs.push(toProductionEntry(join(dir, modules)));
  if (config.css)
    for (const id of config.css)
      inputs.push(
        toDeferResolveProductionEntry(_resolveAlias(id, srcDir, dir)),
      );
};

const findLayerConfigs = (cwd: string): string[] =>
  _syncGlob({ cwd, patterns: [`layers/*/${config.at(0)}`] });

interface NuxtNitroOptions {
  imports?: false | Record<string, unknown>;
  apiDir?: string;
  routesDir?: string;
}

const resolveConfigWithNuxt = async (options: PluginOptions) => {
  const { loadNuxt, resolveAlias } = await import('nuxt/kit');
  const nuxt = await loadNuxt({
    cwd: options.cwd,
    ready: false,
    overrides: { _prepare: true },
  });

  const opts = nuxt.options;
  const extensionGlob = opts.extensions.join(',');
  const inputs: Input[] = [];
  const sourcePatterns = new Set<string>();
  const dependencies = new Set<string>();

  nuxt.hook('imports:extend', (imports) => {
    for (const i of imports) {
      if (isAbsolute(i.from)) sourcePatterns.add(i.from);
      else dependencies.add(i.from);
    }
  });

  nuxt.hook('components:extend', (components) => {
    for (const c of components) {
      if (isAbsolute(c.filePath)) sourcePatterns.add(c.filePath);
    }
  });

  await nuxt.ready();

  try {
    for (const m of opts._installedModules) {
      if (m.entryPath) inputs.push(toProductionEntry(m.entryPath));
      else if (m.meta?.name && !m.meta.name.startsWith('nuxt:'))
        dependencies.add(m.meta.name);
    }

    for (const l of opts.extends || []) {
      const layerName = Array.isArray(l) ? l[0] : l;
      if (typeof layerName === 'string') dependencies.add(layerName);
    }

    const isPagesEnabled = opts.pages !== false;
    const pagesOpts = typeof opts.pages !== 'boolean' && opts.pages;
    const pagesPatterns =
      pagesOpts && pagesOpts.pattern
        ? toArray(pagesOpts.pattern)
        : [`**/*{${extensionGlob}}`];

    const nitroOpts =
      'nitro' in opts
        ? (opts.nitro as NuxtNitroOptions)
        : ({} as NuxtNitroOptions);
    const isNitroImportsEnabled =
      nitroOpts.imports !== false && opts.imports?.scan !== false;

    for (const layer of opts._layers) {
      const cfg = layer.config;
      const srcDir = cfg.srcDir || layer.cwd;
      const rootDir = layer.cwd;

      const middlewareDir = resolve(
        srcDir,
        resolveAlias(cfg.dir?.middleware || 'middleware', opts.alias),
      );
      const pluginsDir = resolve(
        srcDir,
        resolveAlias(cfg.dir?.plugins || 'plugins', opts.alias),
      );
      const serverDir = resolve(
        srcDir,
        resolveAlias(cfg.serverDir || 'server', opts.alias),
      );

      const entryPatterns: string[] = [
        resolve(serverDir, nitroOpts.apiDir || 'api', `**/*{${extensionGlob}}`),
        resolve(
          serverDir,
          nitroOpts.routesDir || 'routes',
          `**/*{${extensionGlob}}`,
        ),
        resolve(serverDir, `middleware/**/*{${extensionGlob}}`),
        resolve(serverDir, `plugins/**/*{${extensionGlob}}`),
        resolve(serverDir, `tasks/**/*{${extensionGlob}}`),
        resolve(
          srcDir,
          resolveAlias(cfg.dir?.layouts || 'layouts', opts.alias),
          `**/*{${extensionGlob}}`,
        ),
        join(middlewareDir, `*{${extensionGlob}}`),
        join(middlewareDir, `*/index{${extensionGlob}}`),
        join(pluginsDir, `*{${extensionGlob}}`),
        join(pluginsDir, `*/index{${extensionGlob}}`),
        join(srcDir, `app{${extensionGlob}}`),
        join(srcDir, `App{${extensionGlob}}`),
      ];

      if (isPagesEnabled) {
        for (const pattern of pagesPatterns) {
          entryPatterns.push(
            resolve(
              srcDir,
              resolveAlias(cfg.dir?.pages || 'pages', opts.alias),
              pattern,
            ),
          );
        }
      }

      if (isNitroImportsEnabled) {
        sourcePatterns.add(
          resolve(
            rootDir,
            cfg.dir?.shared ?? 'shared',
            `utils/*{${extensionGlob}}`,
          ),
        );
        sourcePatterns.add(
          resolve(
            rootDir,
            cfg.dir?.shared ?? 'shared',
            `types/*{${extensionGlob}}`,
          ),
        );
      }

      inputs.push(...entryPatterns.map((s) => toProductionEntry(s)));
    }

    for (const path of sourcePatterns)
      inputs.push(toProductionEntry(path, { allowIncludeExports: true }));
    for (const dep of dependencies) inputs.push(toDependency(dep));
    for (const alias in opts.alias)
      inputs.push(toAlias(alias, opts.alias[alias]));

    return inputs;
  } finally {
    await nuxt.close();
  }
};

const resolveConfigStatic = async (
  localConfig: NuxtConfig,
  options: PluginOptions,
) => {
  const { configFileDir: cwd } = options;
  const hasAppDir = isDirectory(cwd, 'app');
  const srcDir = localConfig.srcDir ?? (hasAppDir ? join(cwd, 'app') : cwd);
  const serverDir = localConfig.serverDir ?? 'server';
  const inputs: Input[] = [];

  for (const id of localConfig.modules ?? []) {
    if (Array.isArray(id) && typeof id[0] === 'string')
      inputs.push(toDependency(id[0]));
    if (typeof id === 'string') inputs.push(toDependency(id));
  }

  addAppEntries(inputs, srcDir, serverDir, localConfig, cwd);

  const aliases = localConfig.alias;
  if (aliases) {
    for (const key in aliases) {
      const prefix = _resolveAlias(aliases[key], srcDir, cwd);
      inputs.push(toAlias(key, prefix));
      if (prefix.endsWith('/') || isDirectory(prefix)) {
        inputs.push(toAlias(join(key, '*'), join(prefix, '*'), { dir: cwd }));
      }
    }
  }

  for (const ext of localConfig.extends ?? []) {
    const resolved = _resolveAlias(ext, srcDir, cwd);
    for (const cfg of _syncGlob({ cwd: resolved, patterns: config })) {
      inputs.push(toConfig('nuxt', join(resolved, cfg)));
    }
  }

  for (const layerConfig of findLayerConfigs(cwd)) {
    inputs.push(toConfig('nuxt', layerConfig));
  }

  if (cwd !== options.cwd) return inputs;

  for (const file of _syncGlob({ cwd, patterns: ['.nuxt/module/*.d.ts'] })) {
    const sourceFile = createSourceFile(join(cwd, file));
    for (const path of collectLocalImportPaths(sourceFile))
      inputs.push(toProductionEntry(path));
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

  inputs.push(toIgnore('#imports', 'unresolved'));
  inputs.push(toIgnore('#components', 'unresolved'));

  return inputs;
};

const resolveConfig: ResolveConfig<NuxtConfig> = async (
  localConfig,
  options,
) => {
  try {
    return await resolveConfigWithNuxt(options);
  } catch (error) {
    debugLog('Nuxt', `Dynamic resolution failed, falling back to static: ${error}`);
    return resolveConfigStatic(localConfig, options);
  }
};

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

/** @public */
export const docs = {};

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
