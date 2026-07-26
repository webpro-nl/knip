import { readdirSync } from 'node:fs';
import { collectImports, getStyleLang, scriptExtractor, styleExtractor } from '../../compilers/compilers.ts';
import { compiler as lessCompiler } from '../../compilers/less.ts';
import { compiler as scssCompiler } from '../../compilers/scss.ts';
import { compiler as stylusCompiler } from '../../compilers/stylus.ts';
import type { CompilerSync } from '../../compilers/types.ts';
import { basename, dirname, isAbsolute, relative } from '../../util/path.ts';
import { createTaglibResolver } from './taglib.ts';

// Concise blocks holding JavaScript or CSS instead of markup: `class {}`, `static {}`, `style.less {}`
const blockMatcher = /(?:^|\n)[ \t]*(class|static|style)((?:\.[\w-]+)*)[^\n{]*\{/g;

const htmlTagMatcher = /<([A-Za-z_][\w-]*)/g;

// Concise mode writes tags without angle brackets, one per line: `fruit-label label="apple"`
const conciseTagMatcher = /^[ \t]*([a-z][\w-]*)(?=[\s.#(|/]|$)/gm;

/** Index just past the `}` matching the `{` at `start`, ignoring braces in strings and comments */
const findBlockEnd = (text: string, start: number) => {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'" || char === '`') {
      while (++i < text.length && text[i] !== char) if (text[i] === '\\') i++;
    } else if (char === '/' && text[i + 1] === '*') {
      i = text.indexOf('*/', i + 2);
      if (i === -1) return text.length;
      i++;
    } else if (char === '/' && text[i + 1] === '/') {
      i = text.indexOf('\n', i);
      if (i === -1) return text.length;
    } else if (char === '{') {
      depth++;
    } else if (char === '}' && --depth === 0) {
      return i + 1;
    }
  }
  return text.length;
};

/** Replace a range with whitespace, so remaining offsets and line numbers stay valid */
const blank = (text: string, start: number, end: number) =>
  text.slice(0, start) + text.slice(start, end).replace(/[^\n]/g, ' ') + text.slice(end);

/** `style.module.scss` and `style.scss` alike hold Sass, so the last extension wins */
const toLang = (shorthand: string) => (shorthand.startsWith('.') ? shorthand.slice(1).split('.').pop() : undefined);

const styleImports = (body: string, lang: string | undefined, path: string) => {
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
 * A `.marko` file mixes markup with JavaScript and CSS blocks. Tag names must be looked for in the
 * markup only, imports in the JavaScript only, and each style block goes to its own preprocessor.
 */
const splitBlocks = (text: string, path: string) => {
  let markup = text;
  let code = text;
  let styles = '';

  const addStyle = (body: string, lang?: string) => {
    const imports = body && styleImports(body, lang, path);
    if (imports) styles = styles ? `${styles}\n${imports}` : imports;
  };

  // `<script>` holds JavaScript, `<style lang="less">` and the shorthand `<style.less>` hold CSS
  for (const matcher of [scriptExtractor, styleExtractor]) {
    const isStyle = matcher === styleExtractor;
    matcher.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(text))) {
      const end = match.index + match[0].length;
      if (isStyle) {
        addStyle(match[2], getStyleLang(match[1]) ?? toLang(match[1].trim()));
        code = blank(code, match.index, end);
      }
      markup = blank(markup, match.index, end);
    }
  }

  blockMatcher.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = blockMatcher.exec(code))) {
    const bodyStart = match.index + match[0].length;
    const end = findBlockEnd(code, bodyStart - 1);
    if (match[1] === 'style') {
      addStyle(code.slice(bodyStart, end - 1), toLang(match[2]));
      code = blank(code, match.index, end);
    }
    markup = blank(markup, match.index, end);
    blockMatcher.lastIndex = end;
  }

  return { markup, code, styles };
};

const collectTagNames = (markup: string) => {
  const names = new Set<string>();
  for (const matcher of [htmlTagMatcher, conciseTagMatcher]) {
    matcher.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(markup))) names.add(match[1]);
  }
  return names;
};

// https://markojs.com/docs/class-components/#single-file-components
const componentFileNames = [
  { name: 'style', isDefaultImport: false },
  { name: 'component', isDefaultImport: true },
  { name: 'component-browser', isDefaultImport: true },
];

/** Strip extension and any [arc] flag, e.g. `basket[mobile].demo.marko` → `basket.demo` */
const toBase = (fileName: string) => {
  const base = fileName.slice(0, fileName.lastIndexOf('.'));
  return base.replace(/\[[^\]]*\]/, '');
};

/**
 * Marko associates sibling `component.js`, `component-browser.js` and `style.css` files with a
 * template automatically, without the template referencing them.
 */
const getComponentFiles = (path: string, fileNames: string[]) => {
  const base = toBase(basename(path));
  // Only `index.marko` and `template.marko` also pick up the unprefixed `component.js` and `style.css`
  const isEntry = base === 'index' || base === 'template';
  const prefix = `(?:${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.${isEntry ? '|' : ''})`;
  const files: { specifier: string; isDefaultImport: boolean }[] = [];
  for (const { name, isDefaultImport } of componentFileNames) {
    const matcher = new RegExp(`^${prefix}${name}\\.\\w+$`);
    const match = fileNames.find(fileName => matcher.test(fileName));
    if (match) files.push({ specifier: `./${match}`, isDefaultImport });
  }
  return files;
};

export const createCompiler = (cwd: string): CompilerSync => {
  const resolveTag = createTaglibResolver(cwd);
  const dirFilesCache = new Map<string, string[]>();

  return (text, path) => {
    const { markup, code, styles } = splitBlocks(text, path);
    const dir = dirname(path);

    const specifiers = new Set<string>();
    const out = ['import "marko";', collectImports(code, path), styles];

    let fileNames = dirFilesCache.get(dir);
    if (!fileNames) {
      try {
        fileNames = readdirSync(dir).sort();
      } catch {
        fileNames = [];
      }
      dirFilesCache.set(dir, fileNames);
    }
    let index = 0;
    for (const { specifier, isDefaultImport } of getComponentFiles(path, fileNames)) {
      // Marko uses the default export of a component file, a style file is a side effect
      out.push(isDefaultImport ? `import _$c${index++} from "${specifier}";` : `import "${specifier}";`);
    }

    for (const name of collectTagNames(markup)) {
      const resolved = resolveTag(name, dir);
      if (!resolved || resolved === path) continue;
      if (isAbsolute(resolved)) {
        const specifier = relative(dir, resolved);
        specifiers.add(specifier.startsWith('.') ? specifier : `./${specifier}`);
      } else {
        specifiers.add(resolved);
      }
    }

    for (const specifier of specifiers) out.push(`import "${specifier}";`);
    return out.filter(Boolean).join('\n');
  };
};
