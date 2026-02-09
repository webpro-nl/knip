import type { IsLoadConfig, IsPluginEnabled, Plugin, RegisterCompilers, ResolveConfig } from '../../types/config.js';
import { isDirectory } from '../../util/fs.js';
import { _syncGlob } from '../../util/glob.js';
import type { Input } from '../../util/input.js';
import { toAlias, toDeferResolveProductionEntry, toDependency, toIgnore, toProductionEntry } from '../../util/input.js';
import { loadTSConfig } from '../../util/load-tsconfig.js';
import { dirname, join } from '../../util/path.js';
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

const production = [
  'app.{vue,jsx,tsx}',
  'error.{vue,jsx,tsx}',
  '**/*.d.vue.ts',
  'layouts/**/*.{vue,jsx,tsx}',
  'middleware/**/*.ts',
  'pages/**/*.{vue,jsx,tsx}',
  'plugins/**/*.ts',
  'server/api/**/*.ts',
  'server/middleware/**/*.ts',
  'server/plugins/**/*.ts',
  'server/routes/**/*.ts',
  'server/tasks/**/*.ts',
  'modules/**/*.ts',
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

const isLoadConfig: IsLoadConfig = options => !options.configFilePath.endsWith('.d.ts');

const addAppEntries = (inputs: Input[], srcDir: string, serverDir: string, localConfig: NuxtConfig) => {
  inputs.push(toProductionEntry(join(srcDir, 'app.{vue,jsx,tsx}')));
  inputs.push(toProductionEntry(join(srcDir, 'error.{vue,jsx,tsx}')));
  inputs.push(toProductionEntry(join(srcDir, '**/*.d.vue.ts')));
  inputs.push(toProductionEntry(join(srcDir, localConfig.dir?.layouts ?? 'layouts', '**/*.{vue,jsx,tsx}')));
  inputs.push(toProductionEntry(join(srcDir, localConfig.dir?.middleware ?? 'middleware', '**/*.ts')));
  inputs.push(toProductionEntry(join(srcDir, localConfig.dir?.pages ?? 'pages', '**/*.{vue,jsx,tsx}')));
  inputs.push(toProductionEntry(join(srcDir, localConfig.dir?.plugins ?? 'plugins', '**/*.ts')));
  inputs.push(toProductionEntry(join(serverDir, 'api/**/*.ts')));
  inputs.push(toProductionEntry(join(serverDir, 'middleware/**/*.ts')));
  inputs.push(toProductionEntry(join(serverDir, 'plugins/**/*.ts')));
  inputs.push(toProductionEntry(join(serverDir, 'routes/**/*.ts')));
  inputs.push(toProductionEntry(join(serverDir, 'tasks/**/*.ts')));
  inputs.push(toProductionEntry('modules/**/*.ts'));
  if(localConfig.css) for(const id of localConfig.css) inputs.push(toDeferResolveProductionEntry(id));
};

const findLayerDirs = (cwd: string): string[] =>
  _syncGlob({ cwd, patterns: ['layers/*/nuxt.config.ts'] }).map(f => join(cwd, dirname(f)));

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
  const { cwd } = options;
  const hasAppDir = isDirectory(cwd, 'app');
  const srcDir = localConfig.srcDir ?? (hasAppDir ? join(cwd, 'app') : cwd);
  const serverDir = localConfig.serverDir ?? 'server';
  const inputs: Input[] = [];

  for (const id of localConfig.modules ?? []) {
    if (Array.isArray(id) && typeof id[0] === 'string') inputs.push(toDependency(id[0]));
    if (typeof id === 'string') inputs.push(toDependency(id));
  }

  addAppEntries(inputs, srcDir, serverDir, localConfig);

  for (const dir of findLayerDirs(cwd)) {
    const layerAppDir = isDirectory(dir, 'app') ? join(dir, 'app') : dir;
    const layerServerDir = join(dir, 'server');
    inputs.push(toProductionEntry(join(dir, 'nuxt.config.ts')));
    addAppEntries(inputs, layerAppDir, layerServerDir, localConfig);
  }

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
  production,
  setup,
  isLoadConfig,
  resolveConfig,
  registerCompilers,
};

export default plugin;
