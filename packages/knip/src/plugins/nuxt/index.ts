import type { NuxtOptions } from 'nuxt/schema';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toAlias, toDependency, toProductionEntry } from '../../util/input.js';
import { isAbsolute, join, resolve } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { NuxtConfig } from './types.js';

const title = 'Nuxt';

const enablers = ['nuxt', 'nuxt-nightly'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['nuxt.config.{js,mjs,ts}'];

const production = [
  'app.{vue,jsx,tsx}',
  'error.{vue,jsx,tsx}',
  'pages/**/*.{vue,jsx,tsx}',
  'layouts/default.{vue,jsx,tsx}',
  'middleware/**/*.ts',
  'server/api/**/*.ts',
  'server/routes/**/*.ts',
  'server/middleware/**/*.ts',
  'server/plugins/**/*.ts',
];

const setup = async () => {};

const resolveConfig: ResolveConfig<NuxtConfig> = async (_localConfig, options) => {
  const inputs: Input[] = [];

  const { loadNuxt, resolveAlias } = await import('nuxt/kit');
  const nuxt = await loadNuxt({
    cwd: options.cwd,
    // we want to register hooks before proceeding with nuxt lifecycle
    ready: false,
    overrides: {
      // used to skip expensive build-time startup cost
      _prepare: true,
    },
  });

  const extensionGlob = nuxt.options.extensions.join(',');

  const availableSources = new Set<string>();
  const dependencies = new Set<string>();

  nuxt.hook('imports:extend', imports => {
    for (const i of imports) {
      if (isAbsolute(i.from)) {
        availableSources.add(i.from);
      } else {
        dependencies.add(i.from);
      }
    }
  });

  nuxt.hook('components:extend', components => {
    for (const c of components) {
      if (isAbsolute(c.filePath)) {
        availableSources.add(c.filePath);
      }
    }
  });

  await nuxt.ready();

  // 1. dependencies (modules)
  for (const m of nuxt.options._installedModules) {
    if (m.entryPath) {
      inputs.push(toProductionEntry(m.entryPath));
    } else if (m.meta.name && !m.meta.name.startsWith('nuxt:')) {
      dependencies.add(m.meta.name);
    }
  }

  // 2. dependencies (layers)
  for (const l of nuxt.options.extends || []) {
    const layerName = Array.isArray(l) ? l[0] : l;
    if (typeof layerName === 'string') {
      dependencies.add(layerName);
    }
  }

  // 3. user code
  const isPagesEnabled = nuxt.options.pages !== false;
  const pagesPatterns =
    typeof nuxt.options.pages === 'boolean' || !nuxt.options.pages.pattern
      ? [`**/*{${extensionGlob}}`]
      : toArray(nuxt.options.pages.pattern);

  const isNitroImportsEnabled = nuxt.options.nitro.imports !== false && nuxt.options.imports.scan !== false;

  for (const layer of nuxt.options._layers) {
    const config = layer.cwd === nuxt.options.rootDir ? nuxt.options : (layer.config as NuxtOptions);
    const srcDir = layer.config.srcDir || layer.cwd;
    const rootDir = layer.cwd;

    const middlewareDir = resolve(srcDir, resolveAlias(config.dir?.middleware || 'middleware', nuxt.options.alias));
    const pluginsDir = resolve(srcDir, resolveAlias(config.dir?.plugins || 'plugins', nuxt.options.alias));
    const serverDir = resolve(srcDir, resolveAlias(config.serverDir || 'server', nuxt.options.alias));

    const entryPatterns: string[] = [
      // nitro routes
      resolve(serverDir, config.nitro.apiDir || 'api', `**/*{${extensionGlob}}`),
      resolve(serverDir, config.nitro.routesDir || 'routes', `**/*{${extensionGlob}}`),
      resolve(serverDir, `middleware/**/*{${extensionGlob}}`),
      resolve(serverDir, `plugins/**/*{${extensionGlob}}`),
      resolve(serverDir, `tasks/**/*{${extensionGlob}}`),
      // nuxt app
      resolve(srcDir, resolveAlias(config.dir?.layouts || 'layouts', nuxt.options.alias), `**/*{${extensionGlob}}`),
      join(middlewareDir, `*{${extensionGlob}}`),
      join(middlewareDir, `*/index{${extensionGlob}}`),
      join(pluginsDir, `*{${extensionGlob}}`),
      join(pluginsDir, `*/index{${extensionGlob}}`),
      join(srcDir, `app{${extensionGlob}}`),
      join(srcDir, `App{${extensionGlob}}`),
    ];

    // file-system routing integration with vue-router
    if (isPagesEnabled) {
      for (const pattern of pagesPatterns) {
        entryPatterns.push(resolve(srcDir, resolveAlias(config.dir?.pages || 'pages', nuxt.options.alias), pattern));
      }
    }

    // add nitro auto-imported paths to cover edge case where they are
    // enabled for nitro but not for nuxt
    if (isNitroImportsEnabled) {
      availableSources.add(resolve(rootDir, config.dir.shared ?? 'shared', `utils/*{${extensionGlob}}`));
      availableSources.add(resolve(rootDir, config.dir.shared ?? 'shared', `types/*{${extensionGlob}}`));
    }

    inputs.push(...entryPatterns.map(s => toProductionEntry(s)));
  }

  // TODO: we need to register these as source files which may not be all used
  for (const path of availableSources) {
    inputs.push(toProductionEntry(path, { allowIncludeExports: true }));
  }

  for (const dep of dependencies) {
    inputs.push(toDependency(dep));
  }

  for (const alias in nuxt.options.alias) {
    inputs.push(toAlias(alias, nuxt.options.alias[alias]));
  }

  await nuxt.close();

  return inputs;
};

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

/** @public */
export const docs = {};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  setup,
  resolveConfig,
} satisfies Plugin;
