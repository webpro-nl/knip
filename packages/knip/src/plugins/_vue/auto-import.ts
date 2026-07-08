import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { type ParseResult, Visitor } from 'oxc-parser';
import { scriptBodies } from '../../compilers/compilers.ts';
import { stylePreprocessorImports } from '../../compilers/style-preprocessors.ts';
import { _parseFile } from '../../typescript/ast-nodes.ts';
import { isFile } from '../../util/fs.ts';
import { _syncGlob } from '../../util/glob.ts';
import { dirname, isInNodeModules, join } from '../../util/path.ts';
import type { AutoImportMaps, TemplateAstNode, VueSfc } from './types.ts';

const getVueSfc = (cwd: string): VueSfc => {
  try {
    return createRequire(join(cwd, 'package.json'))('vue/compiler-sfc');
  } catch {}
  return {
    parse: (source: string, path: string) => ({
      descriptor: { script: { content: scriptBodies(source, path) }, scriptSetup: null, template: { content: '' } },
    }),
  };
};

const readFile = (filePath: string): string => {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
};

export const readAndParseFile = (filePath: string) => _parseFile(filePath, readFile(filePath));

const collectIdentifiers = (source: string, fileName: string) => {
  const identifiers = new Set<string>();
  const visitor = new Visitor({
    Identifier(node) {
      identifiers.add(node.name);
    },
  });
  visitor.visit(_parseFile(fileName, source).program);
  return identifiers;
};

const collectTemplateInfo = (tree: TemplateAstNode) => {
  const tags = new Set<string>();
  const identifiers = new Set<string>();
  const addExprIdentifiers = (expr: string) => {
    for (const id of collectIdentifiers(expr, 'expr.ts')) identifiers.add(id);
  };
  const visit = (node: TemplateAstNode) => {
    if (node.tag) tags.add(node.tag);
    if (node.type === 5 && node.content && !node.content.isStatic) addExprIdentifiers(node.content.content);
    if (node.props) {
      for (const prop of node.props) {
        if (prop.type === 7) {
          if (prop.exp && !prop.exp.isStatic) addExprIdentifiers(prop.exp.content);
          if (prop.arg && !prop.arg.isStatic) addExprIdentifiers(prop.arg.content);
        }
      }
    }
    if (node.children) for (const child of node.children) visit(child);
  };
  visit(tree);
  return { tags, identifiers };
};

const toKebabCase = (s: string) => s.replace(/[A-Z]/g, (m, i) => (i ? '-' : '') + m.toLowerCase());

const isLocalSpecifier = (specifier: string) => specifier.startsWith('.') && !isInNodeModules(specifier);

export const collectLocalImportPaths = (filePath: string, result: ParseResult) => {
  const dir = dirname(filePath);
  const paths = new Set<string>();
  const visitor = new Visitor({
    TSImportType(node) {
      const specifier = node.source.value;
      if (isLocalSpecifier(specifier)) paths.add(join(dir, specifier));
    },
  });
  visitor.visit(result.program);
  return paths;
};

export function buildAutoImportMap(filePath: string, result: ParseResult, maps: AutoImportMaps, isComponents: boolean) {
  const dir = dirname(filePath);

  const importTypes: { start: number; end: number; specifier: string }[] = [];
  const collectVisitor = new Visitor({
    TSImportType(node) {
      importTypes.push({ start: node.start, end: node.end, specifier: node.source.value });
    },
  });
  collectVisitor.visit(result.program);

  const addEntry = (name: string, start: number, end: number) => {
    const importType = importTypes.find(it => it.start >= start && it.end <= end);
    if (!importType || !isLocalSpecifier(importType.specifier)) return;
    const absSpecifier = join(dir, importType.specifier);
    if (isComponents) {
      const components = maps.componentMap.get(name);
      if (components) {
        if (!components.includes(absSpecifier)) components.push(absSpecifier);
      } else maps.componentMap.set(name, [absSpecifier]);
    } else {
      maps.importMap.set(name, absSpecifier);
    }
  };

  const matchVisitor = new Visitor({
    VariableDeclarator(node) {
      if (node.id?.type !== 'Identifier' || node.id.name.startsWith('Lazy')) return;
      addEntry(node.id.name, node.start, node.end);
    },
    TSPropertySignature(node) {
      const key = node.key;
      const name = key?.type === 'Identifier' ? key.name : key?.type === 'Literal' ? String(key.value) : undefined;
      if (name) addEntry(name, node.start, node.end);
    },
    ExportNamedDeclaration(node) {
      if (!node.source) return;
      const specifier = node.source.value;
      if (!isLocalSpecifier(specifier)) return;
      const absSpecifier = join(dir, specifier);
      for (const s of node.specifiers) {
        const name = s.exported.type === 'Identifier' ? s.exported.name : s.exported.value;
        if (name) maps.importMap.set(name, absSpecifier);
      }
    },
  });
  matchVisitor.visit(result.program);
}

export const createAutoImportMaps = (): AutoImportMaps => ({ importMap: new Map(), componentMap: new Map() });

export const findGeneratedDts = (cwd: string, signature: string): string[] =>
  _syncGlob({ cwd, patterns: ['*.d.ts', 'src/**/*.d.ts'] }).filter(filePath =>
    readFile(filePath).slice(0, 300).includes(signature)
  );

const generators = [
  { signature: 'Generated by unplugin-vue-components', isComponents: true },
  { signature: 'Generated by unplugin-auto-import', isComponents: false },
];

const getVueAutoImportMaps = (cwd: string): AutoImportMaps => {
  const maps = createAutoImportMaps();
  for (const filePath of _syncGlob({ cwd, patterns: ['*.d.ts', 'src/**/*.d.ts'] })) {
    const source = readFile(filePath);
    const generator = generators.find(({ signature }) => source.slice(0, 300).includes(signature));
    if (generator) buildAutoImportMap(filePath, _parseFile(filePath, source), maps, generator.isComponents);
  }
  return maps;
};

const getSyntheticImports = (maps: AutoImportMaps, identifiers: Set<string>, templateTags?: Set<string>) => {
  const { importMap, componentMap } = maps;
  if (importMap.size === 0 && (!templateTags || componentMap.size === 0)) return [];

  const syntheticImports: string[] = [];

  for (const [name, specifier] of importMap) {
    if (identifiers.has(name)) syntheticImports.push(`import { ${name} } from '${specifier}';`);
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
        syntheticImports.push(`import { default as ${name} } from '${specifiers[0]}';`);
        for (let i = 1; i < specifiers.length; i++) syntheticImports.push(`import '${specifiers[i]}';`);
      }
    }
  }

  return syntheticImports;
};

const compileVueSfc = (source: string, path: string, maps: AutoImportMaps, root: string) => {
  if (maps.importMap.size === 0 && maps.componentMap.size === 0) {
    return [scriptBodies(source, path), stylePreprocessorImports(source, path)].filter(Boolean).join(';\n');
  }

  const { descriptor } = sfcForRoot(root).parse(source, path);
  const scripts: string[] = [];
  if (descriptor.script?.content) scripts.push(descriptor.script.content);
  if (descriptor.scriptSetup?.content) scripts.push(descriptor.scriptSetup.content);

  const identifiers = scripts.length === 0 ? new Set<string>() : collectIdentifiers(scripts.join('\n'), path);
  let templateTags: Set<string> | undefined;
  if (descriptor.template?.ast) {
    const info = collectTemplateInfo(descriptor.template.ast);
    templateTags = info.tags;
    for (const id of info.identifiers) identifiers.add(id);
  }
  scripts.push(...getSyntheticImports(maps, identifiers, templateTags));

  const styles = stylePreprocessorImports(source, path);
  if (styles) scripts.push(styles);

  return scripts.join(';\n');
};

const compileTs = (source: string, path: string, maps: AutoImportMaps) => {
  if (maps.importMap.size === 0 || path.endsWith('.d.ts') || path.endsWith('.config.ts')) return source;
  const syntheticImports = getSyntheticImports(maps, collectIdentifiers(source, path));
  return syntheticImports.length === 0 ? source : `${source}\n${syntheticImports.join('\n')}`;
};

const tagMatcher = /<([a-zA-Z][\w.-]*)/g;
const fencedCodeMatcher = /(`{3,}|~{3,})[\s\S]*?^[ \t]*\1/gm;
const inlineCodeMatcher = /`[^`\n]*`/g;

const stripCode = (md: string) => md.replace(fencedCodeMatcher, '').replace(inlineCodeMatcher, '');

const compileMarkdown = (source: string, path: string, maps: AutoImportMaps) => {
  const code = stripCode(source);
  const scripts = scriptBodies(code, path);
  if (maps.importMap.size === 0 && maps.componentMap.size === 0) return scripts;
  const tags = new Set<string>();
  for (const [, tag] of code.matchAll(tagMatcher)) tags.add(tag);
  const identifiers = scripts ? collectIdentifiers(scripts, path) : new Set<string>();
  return [scripts, ...getSyntheticImports(maps, identifiers, tags)].filter(Boolean).join(';\n');
};

export const createVueCompiler = (maps: AutoImportMaps, cwd: string) => (source: string, path: string) =>
  compileVueSfc(source, path, maps, cwd);
export const createTsCompiler = (maps: AutoImportMaps) => (source: string, path: string) =>
  compileTs(source, path, maps);

const EMPTY_MAPS = createAutoImportMaps();
const rootByDir = new Map<string, string>();
const mapsByRoot = new Map<string, AutoImportMaps>();
const sfcByRoot = new Map<string, VueSfc>();

const findRoot = (fromDir: string): string => {
  const cached = rootByDir.get(fromDir);
  if (cached !== undefined) return cached;
  let dir = fromDir;
  let root = '';
  for (;;) {
    if (isFile(join(dir, 'package.json'))) {
      root = dir;
      break;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  rootByDir.set(fromDir, root);
  return root;
};

const mapsForFile = (path: string): AutoImportMaps => {
  const root = findRoot(dirname(path));
  if (!root) return EMPTY_MAPS;
  let maps = mapsByRoot.get(root);
  if (!maps) {
    maps = getVueAutoImportMaps(root);
    mapsByRoot.set(root, maps);
  }
  return maps;
};

function sfcForRoot(root: string): VueSfc {
  let sfc = sfcByRoot.get(root);
  if (!sfc) {
    sfc = getVueSfc(root);
    sfcByRoot.set(root, sfc);
  }
  return sfc;
}

export const vueAutoImportCompiler = (source: string, path: string) =>
  compileVueSfc(source, path, mapsForFile(path), findRoot(dirname(path)));
export const tsAutoImportCompiler = (source: string, path: string) => compileTs(source, path, mapsForFile(path));
export const markdownAutoImportCompiler = (source: string, path: string) =>
  compileMarkdown(source, path, mapsForFile(path));
