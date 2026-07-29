import type { IsPluginEnabled, Plugin, RegisterCompilers, Resolve, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import { type Input, toDeferResolve, toDependency, toProductionEntry } from '../../util/input.ts';
import { join, relative } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import compiler from './compiler.ts';
import type { MarkoTagDef, MarkoTaglib } from './types.ts';

// https://markojs.com/docs/custom-tags/
// https://markojs.com/docs/marko-json/

const title = 'Marko';

const enablers = ['marko'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['**/marko.json', '**/marko-tag.json'];

const tagDiscoveryDirs = ['components', 'tags'];
const scriptExtensions = '{js,jsx,ts,tsx,mjs,cjs,mts,cts}';
const styleExtensions = '{css,less,scss,sass,styl,stylus}';
const tagFilePatterns = [
  '**/*.marko',
  `**/{component,component-browser}.${scriptExtensions}`,
  `**/*.{component,component-browser}.${scriptExtensions}`,
  `**/style.${styleExtensions}`,
  `**/*.style.${styleExtensions}`,
];

const toArray = (value: string | string[] | undefined) => (typeof value === 'string' ? [value] : (value ?? []));
const toTagEntries = (dir: string) => tagFilePatterns.map(pattern => toProductionEntry(join(dir, pattern)));

const tagProduction = tagFilePatterns.map(pattern => `**/{${tagDiscoveryDirs.join(',')}}/${pattern}`);
export const production = tagProduction;

const tagDefFields = [
  'template',
  'renderer',
  'parse',
  'migrate',
  'transform',
  'analyze',
  'translate',
] satisfies (keyof MarkoTagDef)[];

const resolveConfig: ResolveConfig<MarkoTaglib & MarkoTagDef> = (localConfig, options) => {
  const { configFileName, configFileDir, cwd } = options;
  const inputs: Input[] = [];
  if (!localConfig) return inputs;

  if (configFileName === 'marko-tag.json') {
    for (const field of tagDefFields) {
      for (const id of [localConfig[field]].flat()) {
        if (typeof id === 'string') inputs.push(toDeferResolve(join(configFileDir, id)));
      }
    }
    return inputs;
  }

  const dir = relative(cwd, configFileDir);

  for (const tagsDir of toArray(localConfig['tags-dir'])) {
    inputs.push(...toTagEntries(join(dir, tagsDir)));
  }

  if (localConfig.exports) {
    for (const tagsDir of tagDiscoveryDirs) inputs.push(...toTagEntries(join(dir, `**/${tagsDir}`)));
  }

  return inputs;
};

const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const;

const resolve: Resolve = ({ cwd, rootCwd, manifest }) => {
  const packageNames = new Set<string>();
  for (const field of dependencyFields) {
    for (const packageName in manifest[field] ?? {}) packageNames.add(packageName);
  }

  const inputs: Input[] = [];
  for (const packageName of packageNames) {
    if (
      isFile(cwd, `node_modules/${packageName}/marko.json`) ||
      (cwd !== rootCwd && isFile(rootCwd, `node_modules/${packageName}/marko.json`))
    ) {
      inputs.push(toDependency(packageName));
    }
  }
  return inputs;
};

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (hasDependency('marko')) registerCompiler({ extension: '.marko', compiler });
};

const note = `Marko compiles \`.marko\` files, so this plugin registers a lightweight compiler that extracts
explicit module imports, re-exports and style imports without loading the Marko compiler.

Marko automatically discovers installed tag libraries. Direct dependencies with a root \`marko.json\`
are therefore considered used without checking which of their tags appear in templates.

Local tag templates and their conventionally associated component and style files in \`components\`
(Marko 5), \`tags\` (Marko 6), or a configured \`tags-dir\` are conservatively treated as production
entries. Knip does not yet resolve individual custom tag names, so it cannot report an unused
auto-discovered tag inside those directories. Modern Marko 5 \`marko-tag.json\` entry points and
compiler hooks are also resolved.`;

export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolve,
  resolveConfig,
  registerCompilers,
};

export default plugin;
