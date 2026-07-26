import { createRequire } from 'node:module';
import { collectImports } from '../../compilers/compilers.ts';
import { compiler as lessCompiler } from '../../compilers/less.ts';
import { compiler as scssCompiler } from '../../compilers/scss.ts';
import { compiler as stylusCompiler } from '../../compilers/stylus.ts';
import type { CompilerSync } from '../../compilers/types.ts';
import { dirname, extname, join } from '../../util/path.ts';
import type { MarkoCompiler, MarkoDep } from './types.ts';

const styleImports = (body: string, lang: string, path: string) => {
  switch (lang) {
    case 'less':
      return lessCompiler(body, path);
    case 'styl':
    case 'stylus':
      return stylusCompiler(body, path);
    default:
      return scssCompiler(body, path);
  }
};

/**
 * Load the project's own `@marko/compiler`, the way `@marko/language-tools` does. The translator is a
 * specifier to resolve from the project, since Marko 5 and Marko 6 ship different ones.
 */
const loadCompiler = (cwd: string) => {
  try {
    const require = createRequire(join(cwd, '_.js'));
    let configPath: string;
    try {
      configPath = require.resolve('@marko/compiler/config');
    } catch {
      configPath = createRequire(require.resolve('marko/package.json')).resolve('@marko/compiler/config');
    }
    const imported = require(configPath);
    const defaults: { translator: string } = imported?.__esModule && imported.default ? imported.default : imported;
    const compiler: MarkoCompiler = require(dirname(configPath));
    // Sharing one cache lets taglib lookups be reused across templates
    const config = { ...defaults, cache: new Map(), translator: require(require.resolve(defaults.translator)) };
    compiler.configure(config);
    return { compiler, config };
  } catch {}
};

const depImports = (deps: MarkoDep[] | undefined, path: string) => {
  const imports: string[] = [];
  for (const dep of deps ?? []) {
    if (typeof dep === 'string') imports.push(`import "${dep}";`);
    // An inline `style` block has no file to import, so its body goes to the preprocessor instead
    else if (dep.code) imports.push(styleImports(dep.code, extname(dep.virtualPath ?? '').slice(1), path));
  }
  return imports;
};

/**
 * Compiling a template is the only reliable way to see what it references. Custom tags, sibling
 * `component.js` and `style.css` files and the Marko runtime are all resolved by the compiler and
 * emitted as imports, while the source itself has no mention of them.
 *
 * Returns nothing if the compiler can't be loaded, so that templates are left alone rather than
 * analyzed as if they had no tags.
 */
export const createCompiler = (cwd: string): CompilerSync | undefined => {
  const loaded = loadCompiler(cwd);
  if (!loaded) return;

  return (text, path) => {
    try {
      const { code, meta } = loaded.compiler.compileSync(text, path, loaded.config);
      return [collectImports(code, path), ...depImports(meta.deps, path)].filter(Boolean).join('\n');
    } catch {
      // Nothing read from a template that does not compile can be trusted
      return '';
    }
  };
};
