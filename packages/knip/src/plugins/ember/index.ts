import { readdirSync } from 'node:fs';
import type {
  IsPluginEnabled,
  Plugin,
  RegisterCompilers,
  RegisterVisitors,
  Resolve,
  ResolveConfig,
  ResolveSourceMap,
} from '../../types/config.ts';
import { isDirectory, isFile, loadJSON } from '../../util/fs.ts';
import { type Input, toAlias, toDependency, toEntry, toEntryPath, toIgnore, toProject } from '../../util/input.ts';
import { getPackageNameFromSpecifier } from '../../util/modules.ts';
import { dirname, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { resolvePackageManifestPath } from '../../util/resolve.ts';
import { compiler } from './compiler.ts';
import type { EmberAddonConfig, EmberPackage } from './types.ts';
import { createImportSyncVisitor } from './visitors/importSync.ts';

// https://cli.emberjs.com/release/basic-use/folder-layout/
// https://github.com/embroider-build/embroider/blob/7e612abfb59fad4aacca2bca7d44e2ccf8cbf3fe/packages/core/src/module-resolver.ts

const title = 'Ember';

const enablers = ['ember-cli', 'ember-source'];

const isEnabled: IsPluginEnabled = ({ dependencies, manifest }) =>
  hasDependency(dependencies, enablers) || Boolean(manifest.peerDependencies?.['ember-source']);

const packageJsonPath = 'ember-addon';

const config = ['package.json'];

const getAppPatterns = (dir: string) => [
  `${dir}/styles/app.{css,scss,sass,less,styl}`,
  `${dir}/{app,router,resolver}.{js,ts}`,
  `${dir}/{adapters,components,controllers,helpers,initializers,instance-initializers,locations,models,modifiers,routes,serializers,services,templates,transforms}/**/*.{js,ts,gjs,gts}`,
];

const entry = [
  'ember-cli-build.{js,cjs,mjs}',
  'testem.{js,cjs,mjs}',
  'config/*.js',
  'blueprints/*/index.js',
  'server/index.js',
  'server/{mocks,proxies}/**/*.js',
  'tests/test-helper.{js,ts}',
  'tests/**/*{-,.}test.{js,ts,gjs,gts}',
  'tests/dummy/config/*.js',
  ...getAppPatterns('tests/dummy/app'),
  'addon-test-support/**/*.{js,ts,gjs,gts}',
];

const production = [...getAppPatterns('app'), 'addon/**/*.{js,ts,gjs,gts}'];

const implicitFields = [
  'app-js',
  'public-assets',
  'implicit-modules',
  'implicit-scripts',
  'implicit-styles',
  'renamed-modules',
];

const isAddon = (pkg: EmberPackage) => Boolean(pkg.keywords?.includes('ember-addon'));

const getModuleNames = (dir: string) => {
  const names: string[] = [];
  if (!isDirectory(dir)) return names;
  for (const name of readdirSync(dir)) {
    if (!name.startsWith('@')) names.push(name.replace(/\.js$/, ''));
    else for (const scoped of readdirSync(join(dir, name))) names.push(`${name}/${scoped.replace(/\.js$/, '')}`);
  }
  return names;
};

const resolveConfig: ResolveConfig<EmberAddonConfig> = async (config, { cwd }) => {
  const inputs: Input[] = [];
  if (config.main) inputs.push(toEntryPath(join(cwd, config.main), { production: true }));
  for (const path of config.paths ?? []) {
    inputs.push(
      toEntry(join(path, 'index.js')),
      toEntry(join(path, '{addon,app}/**/*.{js,ts,gjs,gts}'), { production: true })
    );
    const manifestPath = join(cwd, path, 'package.json');
    const { name }: EmberPackage = isFile(manifestPath) ? await loadJSON(manifestPath) : {};
    if (name) {
      inputs.push(
        toAlias(name, join(cwd, path, 'addon'), { dir: cwd }),
        toAlias(`${name}/*`, join(cwd, path, 'addon/*'), { dir: cwd })
      );
    }
  }
  return inputs;
};

const resolveSourceMap: ResolveSourceMap = ({ cwd, dependencies }) =>
  dependencies.has('@embroider/addon-dev') ? [{ srcDir: join(cwd, 'src'), outDir: join(cwd, 'dist') }] : [];

const resolve: Resolve = async ({ cwd, manifest }) => {
  const inputs: Input[] = [toIgnore('^@embroider/virtual($|/)', 'dependencies'), toProject('!blueprints/*/files/**')];
  if (!manifest.exports) {
    if (isAddon(manifest)) {
      inputs.push(
        toAlias('dummy/tests/*', './tests/*', { dir: cwd }),
        toAlias('dummy/*', './tests/dummy/app/*', { dir: cwd }),
        toIgnore('dummy', 'dependencies'),
        toEntry('app/**/*.{js,ts,gjs,gts}', { production: true })
      );
    } else if (manifest.name) {
      inputs.push(
        toAlias(`${manifest.name}/tests/*`, './tests/*', { dir: cwd }),
        toAlias(`${manifest.name}/*`, './app/*', { dir: cwd })
      );
    }
  }
  const isDeclared = (name: string) =>
    Boolean(
      manifest.dependencies?.[name] ||
      manifest.devDependencies?.[name] ||
      manifest.peerDependencies?.[name] ||
      manifest.optionalDependencies?.[name]
    );
  const checked = new Set<string>();
  const provided = new Set<string>();
  for (const dependencies of [manifest.dependencies, manifest.devDependencies, manifest.peerDependencies]) {
    for (const name in dependencies) {
      if (name === 'ember-auto-import') inputs.push(toDependency('webpack', { production: true, optional: true }));
      if (name === 'ember-fetch' && !isDeclared('fetch')) provided.add('fetch');
      const path = resolvePackageManifestPath(name, cwd);
      if (!path) continue;
      const pkg: EmberPackage = await loadJSON(path);
      if (!isAddon(pkg)) continue;
      const meta = pkg['ember-addon'];
      if (!meta || meta.version !== 2 || implicitFields.some(field => Object.keys(meta[field] ?? {}).length > 0)) {
        inputs.push(toDependency(name, { production: dependencies !== manifest.devDependencies }));
      }
      const dir = dirname(path);
      for (const dependency in pkg.dependencies) {
        if (checked.has(dependency) || isDeclared(dependency)) continue;
        checked.add(dependency);
        const nestedPath = resolvePackageManifestPath(dependency, dir);
        if (nestedPath && isAddon(await loadJSON(nestedPath))) provided.add(dependency);
      }
      const renamedModules = meta?.['renamed-modules'];
      if (name === 'ember-source' && !renamedModules) {
        for (const module of [
          ...getModuleNames(join(dir, 'dist/packages')),
          ...getModuleNames(join(dir, 'dist/dependencies')),
        ]) {
          if (!isDeclared(module)) provided.add(module);
        }
      }
      for (const specifier in renamedModules) {
        const packageName = getPackageNameFromSpecifier(specifier);
        if (packageName && !isDeclared(packageName)) provided.add(packageName);
      }
    }
  }
  for (const name of provided) inputs.push(toIgnore(name, 'dependencies'));
  return inputs;
};

const registerCompilers: RegisterCompilers = ({ dependencies, hasDependency, registerCompiler }) => {
  if (!hasDependency('ember-cli') && !hasDependency('ember-source') && !dependencies.has('ember-source')) return;
  registerCompiler({ extension: '.gjs', compiler });
  registerCompiler({ extension: '.gts', compiler });
};

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createImportSyncVisitor(ctx));
};

const note = `Apps from the Vite blueprint export \`app\` and \`tests\` in \`package.json\`, which makes all their files entry files. Enable [includeSubpathExports](/reference/configuration#includesubpathexports) to report unused files in these directories.

Pods or a custom app directory? Override the default \`entry\` patterns to match the layout.`;

/** @public */
export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  entry,
  production,
  resolveConfig,
  resolve,
  resolveSourceMap,
  registerCompilers,
  registerVisitors,
};

export default plugin;
