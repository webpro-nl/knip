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
const production = tagProduction;

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
