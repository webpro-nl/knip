import type { IsPluginEnabled, Plugin, RegisterCompilers, Resolve, ResolveConfig } from '../../types/config.ts';
import { type Input, toDeferResolve, toDependency, toProductionEntry } from '../../util/input.ts';
import { join, relative } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { createCompiler } from './compiler.ts';
import type { MarkoTagDef, MarkoTaglib } from './types.ts';

// https://markojs.com/docs/custom-tags/
// https://markojs.com/docs/marko-json/
// https://github.com/marko-js/run

const title = 'Marko';

const enablers = ['marko'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['**/marko.json', '**/marko-tag.json'];

// Marko 5 auto-scans `components`, Marko 6 `tags`, interop projects both
const tagDiscoveryDirs = ['components', 'tags'];

const toArray = (value: string | string[] | undefined) => (typeof value === 'string' ? [value] : (value ?? []));

// @marko/build pages and @marko/run routes
export const production = [
  'src/pages/**/*.marko',
  'src/routes/**/+{page,layout,404,500}.marko',
  'src/routes/**/+{handler,middleware,meta}.{js,mjs,ts,mts}',
];

// Files a tag definition points to instead of importing
const tagDefFields = [
  'template',
  'renderer',
  'transformer',
  'transform',
  'migrator',
  'migrate',
  'code-generator',
  'translate',
  'node-factory',
  'parse',
  'analyze',
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

  // A `tags-dir` outside `node_modules` overrides tag discovery, so those are the tags of this package
  for (const tagsDir of toArray(localConfig['tags-dir'])) {
    inputs.push(toProductionEntry(join(dir, tagsDir, '**/*.marko')));
  }

  // `exports` means this package publishes the tags it discovers locally, making them its public API
  if (localConfig.exports) {
    inputs.push(toProductionEntry(join(dir, `**/{${tagDiscoveryDirs.join(',')}}/**/*.marko`)));
  }

  return inputs;
};

// Every Marko toolchain compiles templates through @marko/compiler, but not every one declares it as a peer
const resolve: Resolve = () => [toDependency('@marko/compiler', { optional: true })];

const registerCompilers: RegisterCompilers = ({ registerCompiler, cwd, hasDependency }) => {
  if (!hasDependency('marko')) return;
  // Marko depends on @marko/compiler, so this only comes up empty when node_modules is incomplete
  const compiler = createCompiler(cwd);
  if (compiler) registerCompiler({ extension: '.marko', compiler });
};

const note = `Marko compiles \`.marko\` files, so this plugin registers a compiler for them to find imports,
style blocks and custom tags.

Using a custom tag is often the only reference a project has to what implements it, so tags are resolved
through the project's own \`@marko/compiler\` taglib lookup. This covers both Marko 5 and Marko 6:

- Tags in \`components\` (Marko 5) and \`tags\` (Marko 6) directories, and in the \`tags-dir\` of a
  \`marko.json\`.
- Tags from any dependency that ships a \`marko.json\`, which Marko discovers automatically. This is why
  a package like \`@ebay/ebayui-core\` is not reported as an unused dependency when only its tags are used.

When \`@marko/compiler\` is not installed, the same locations are scanned directly as a fallback.

A \`marko.json\` with an \`exports\` field means the package publishes the tags it discovers locally, so
those are added as production entry files.

Sibling \`component.js\`, \`component-browser.js\` and \`style.css\` files are associated with a template
by Marko automatically, so they are not reported as unused either.`;

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
