import { createRequire } from 'node:module';
import ts from 'typescript';
import { scriptBodies } from '../../compilers/compilers.js';
import { basename, dirname, isInNodeModules, join } from '../../util/path.js';
import type { TemplateAstNode, VueSfc } from './types.js';

export const getVueSfc = (cwd: string): VueSfc => {
  try {
    return createRequire(join(cwd, 'package.json'))('vue/compiler-sfc');
  } catch {}
  return {
    parse: (source: string, path: string) => ({
      descriptor: { script: { content: scriptBodies(source, path) }, scriptSetup: null, template: { content: '' } },
    }),
  };
};

export const createSourceFile = (filePath: string, contents?: string) => {
  const c = contents ?? ts.sys.readFile(filePath, 'utf8') ?? '';
  return ts.createSourceFile(filePath, c, ts.ScriptTarget.Latest);
};

export const collectIdentifiers = (source: string, fileName: string) => {
  const identifiers = new Set<string>();
  const sourceFile = createSourceFile(fileName, source);
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node)) identifiers.add(node.text);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return identifiers;
};

export const collectTemplateInfo = (tree: TemplateAstNode) => {
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

export const toKebabCase = (s: string) => s.replace(/[A-Z]/g, (m, i) => (i ? '-' : '') + m.toLowerCase());

const isLocalSpecifier = (specifier: string) => specifier.startsWith('.') && !isInNodeModules(specifier);

export const collectLocalImportPaths = (sourceFile: ts.SourceFile) => {
  const dir = dirname(sourceFile.fileName);
  const paths = new Set<string>();
  const visit = (node: ts.Node) => {
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      const specifier = node.argument.literal.text;
      if (isLocalSpecifier(specifier)) paths.add(join(dir, specifier));
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return paths;
};

export function buildAutoImportMap(sourceFile: ts.SourceFile) {
  const dir = dirname(sourceFile.fileName);
  const isComponents = basename(sourceFile.fileName) === 'components.d.ts';

  const importMap = new Map<string, string>();
  const componentMap = new Map<string, string[]>();

  function visit(node: ts.Node) {
    if (ts.isVariableStatement(node)) {
      if (node.declarationList.declarations.length === 0) return;
      const decl = node.declarationList.declarations[0];
      if (!ts.isIdentifier(decl.name)) return;
      const name = decl.name.text;
      if (name.startsWith('Lazy')) return;
      if (!decl.type) return;
      const tNode = ts.isImportTypeNode(decl.type)
        ? decl.type
        : ts.isTypeQueryNode(decl.type) &&
          (ts.isImportTypeNode(decl.type.exprName)
            ? decl.type.exprName
            : ts.isQualifiedName(decl.type.exprName) &&
              ts.isImportTypeNode(decl.type.exprName.left) &&
              decl.type.exprName.left);
      if (!tNode || !ts.isLiteralTypeNode(tNode.argument) || !ts.isStringLiteral(tNode.argument.literal)) return;
      const specifier = tNode.argument.literal.text;
      if (!isLocalSpecifier(specifier)) return;
      const absSpecifier = join(dir, specifier);
      if (isComponents) {
        const components = componentMap.get(name);
        if (components) components.push(absSpecifier);
        else componentMap.set(name, [absSpecifier]);
      } else {
        importMap.set(name, absSpecifier);
      }
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (!isLocalSpecifier(specifier)) return;
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          importMap.set(element.name.text, join(dir, specifier));
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return { importMap, componentMap };
}
