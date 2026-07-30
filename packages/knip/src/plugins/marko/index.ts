import type { IsPluginEnabled, Plugin, RegisterCompilers, ResolveConfig } from '../../types/config.ts';
import { type Input, toDeferResolve, toProductionEntry } from '../../util/input.ts';
import { join, relative } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { createCompiler } from './compiler.ts';
import { getTaglibDependencies } from './taglibs.ts';
import type { MarkoTagDef } from './types.ts';

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

const resolveConfig: ResolveConfig<MarkoTagDef> = (localConfig, options) => {
  const { configFileName, configFileDir, cwd } = options;
  const inputs: Input[] = [];
  if (!localConfig) return inputs;

  if (configFileName === 'marko.json') {
    const dir = relative(cwd, configFileDir);
    return tagProduction.map(pattern => toProductionEntry(join(dir, pattern)));
  }

  for (const field of tagDefFields) {
    for (const id of [localConfig[field]].flat()) {
      if (typeof id === 'string') inputs.push(toDeferResolve(join(configFileDir, id)));
    }
  }
  return inputs;
};

const registerCompilers: RegisterCompilers = async ({ cwd, registerCompiler, hasDependency }) => {
  if (hasDependency('marko')) {
    const { tagDependencies, fallbackDependencies } = await getTaglibDependencies(cwd);
    registerCompiler({ extension: '.marko', compiler: createCompiler(tagDependencies, fallbackDependencies) });
  }
};

const note = `Marko compiles \`.marko\` files, so this plugin registers a lightweight compiler that extracts
explicit module imports, re-exports and style imports without loading the Marko compiler.

For installed tag libraries, tag names are discovered from the directory configured by
\`marko.json#exports\` or \`marko.json#tags-dir\` and matched against literal tags in project templates.
Tag libraries without either field are conservatively considered used. \`taglib-imports\` is not resolved.

Local tag templates and their conventionally associated component and style files in \`components\`
(Marko 5) or \`tags\` (Marko 6) are conservatively treated as production entries. Knip does not
report unused auto-discovered local tags inside those directories. Modern Marko 5
\`marko-tag.json\` entry points and compiler hooks are also resolved.`;

export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
  registerCompilers,
};

export default plugin;
