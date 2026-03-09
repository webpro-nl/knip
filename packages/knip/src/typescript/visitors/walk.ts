import type { Program, Span, TSTypeName, Visitor, VisitorObject } from 'oxc-parser';
import { FIX_FLAGS, IMPORT_FLAGS, OPAQUE, SYMBOL_TYPE } from '../../constants.ts';
import type { GetImportsAndExportsOptions } from '../../types/config.ts';
import type { Fix } from '../../types/exports.ts';
import type { IssueSymbol, SymbolType } from '../../types/issues.ts';
import type { Export, ExportMember, ImportMap, ImportMaps } from '../../types/module-graph.ts';
import { addValue } from '../../util/module-graph.ts';
import { isInNodeModules } from '../../util/path.ts';
import { getLineAndCol, getStringValue, isStringLiteral, type ResolveModule } from './helpers.ts';
import { EMPTY_TAGS } from './jsdoc.ts';
import { handleCallExpression, handleNewExpression } from './calls.ts';
import {
  handleExportAssignment,
  handleExportDefault,
  handleExportNamed,
  handleExpressionStatement,
} from './exports.ts';
import { handleImportExpression, handleVariableDeclarator } from './imports.ts';
import { handleJSXMemberExpression, handleMemberExpression } from './members.ts';

interface WalkContext {
  lineStarts: number[];
  skipExports: boolean;
  options: GetImportsAndExportsOptions;
  exports: Map<string, Export>;
  aliasedExports: Map<string, IssueSymbol[]>;
  specifierExportNames: Set<string>;
  scripts: Set<string>;
  addImport: (
    specifier: string,
    identifier: string | undefined,
    alias: string | undefined,
    namespace: string | undefined,
    pos: number,
    modifiers: number,
    specifierPos?: number,
    jsDocTags?: Set<string>
  ) => void;
  addNsMemberRefs: (internalImport: ImportMaps, namespace: string, member: string | string[]) => void;
  addImportAlias: (aliasName: string, id: string, filePath: string) => void;
  internal: ImportMap;
  localImportMap: Map<
    string,
    { importedName: string; filePath: string; isNamespace: boolean; isDynamicImport?: boolean }
  >;
  localDeclarationTypes: Map<string, SymbolType>;
  importAliases: Map<string, Set<{ id: string; filePath: string }>>;
  referencedInExport: Map<string, Set<string>>;
  skipBareExprRefs: boolean;
  destructuredExports: Set<string>;
  hasNodeModuleImport: boolean;
  resolveModule: ResolveModule;
  programFiles: Set<string>;
  entryFiles: Set<string>;
  visitor: Visitor;
  getJSDocTags: (nodeStart: number) => Set<string>;
}

export interface WalkState extends WalkContext {
  filePath: string;
  sourceText: string;
  isJS: boolean;
  handledImportExpressions: Set<number>;
  bareExprRefs: Set<string>;
  accessedAliases: Set<string>;
  shorthandNsContainers: Map<string, Set<string>>;
  accessedShorthandNs: Set<string>;
  chainedMemberExprs: WeakSet<object>;
  currentVarDeclStart: number;
  nsRanges: [number, number][];
  addExport: (
    identifier: string,
    type: SymbolType,
    pos: number,
    members: ExportMember[],
    fix: Fix,
    isReExport: boolean,
    jsDocTags: Set<string>
  ) => void;
  getFix: (start: number, end: number, flags?: number) => Fix;
  getTypeFix: (start: number, end: number) => Fix;
  collectRefsInType: (node: any, exportName: string, signatureOnly: boolean) => void;
  isInNamespace: (node: Span) => boolean;
}

let state: WalkState;

const _getFix = (start: number, end: number, flags?: number): Fix =>
  state.options.isFixExports ? [start, end, flags ?? FIX_FLAGS.NONE] : undefined;

const _getTypeFix = (start: number, end: number): Fix =>
  state.options.isFixTypes ? [start, end, FIX_FLAGS.NONE] : undefined;

const _addExport = (
  identifier: string,
  type: SymbolType,
  pos: number,
  members: ExportMember[],
  fix: Fix,
  isReExport: boolean,
  jsDocTags: Set<string>
) => {
  const item = state.exports.get(identifier);
  if (item) {
    if (members.length) for (const m of members) item.members.push(m);
    if (fix) item.fixes.push(fix);
    if (jsDocTags.size) {
      if (item.jsDocTags === EMPTY_TAGS) {
        item.jsDocTags = new Set(jsDocTags);
      } else {
        for (const t of jsDocTags) item.jsDocTags.add(t);
      }
    }
    item.isReExport = isReExport;
  } else {
    const { line, col } = getLineAndCol(state.lineStarts, pos);
    state.exports.set(identifier, {
      identifier,
      type,
      members,
      jsDocTags,
      pos,
      line,
      col,
      hasRefsInFile: false,
      referencedIn: undefined,
      fixes: fix ? [fix] : [],
      isReExport,
    });
  }
};

const _collectRefsInType = (node: any, exportName: string, signatureOnly: boolean): void => {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'TSTypeQuery') {
    const name = node.exprName.type === 'Identifier' ? node.exprName.name : undefined;
    if (name) {
      const refs = state.referencedInExport.get(name);
      if (refs) refs.add(exportName);
      else state.referencedInExport.set(name, new Set([exportName]));
    }
    return;
  }
  if (signatureOnly) {
    if (node.type === 'FunctionBody' || node.type === 'BlockStatement') return;
  } else if (node.type === 'TSTypeReference' && node.typeName.type === 'Identifier') {
    const name = node.typeName.name;
    const refs = state.referencedInExport.get(name);
    if (refs) refs.add(exportName);
    else state.referencedInExport.set(name, new Set([exportName]));
    return;
  }
  for (const key in node) {
    if (key === 'type' || key === 'parent') continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item === 'object' && item.type) _collectRefsInType(item, exportName, signatureOnly);
      }
    } else if (val && typeof val === 'object' && val.type) {
      _collectRefsInType(val, exportName, signatureOnly);
    }
  }
};

const _isInNamespace = (node: Span) =>
  state.nsRanges.length > 0 && state.nsRanges.some(([start, end]) => node.start >= start && node.end <= end);

export const coreVisitorObject: VisitorObject = {
  TSModuleDeclaration(node) {
    state.nsRanges.push([node.start, node.end]);
  },
  ClassDeclaration(node) {
    if (node.id?.name) state.localDeclarationTypes.set(node.id.name, SYMBOL_TYPE.CLASS);
  },
  FunctionDeclaration(node) {
    if (node.id?.name) state.localDeclarationTypes.set(node.id.name, SYMBOL_TYPE.FUNCTION);
  },
  VariableDeclaration(node) {
    state.currentVarDeclStart = node.start;
    for (const decl of node.declarations) {
      if (decl.id.type === 'Identifier') state.localDeclarationTypes.set(decl.id.name, SYMBOL_TYPE.VARIABLE);
    }
  },
  TSEnumDeclaration(node) {
    if (node.id.name) state.localDeclarationTypes.set(node.id.name, SYMBOL_TYPE.ENUM);
  },
  ExportNamedDeclaration(node) {
    handleExportNamed(node, state);
  },
  ExportDefaultDeclaration(node) {
    handleExportDefault(node, state);
  },
  TSExportAssignment(node) {
    handleExportAssignment(node, state);
  },
  ExpressionStatement(node) {
    handleExpressionStatement(node, state);
  },
  VariableDeclarator(node) {
    handleVariableDeclarator(node, state);
  },
  ImportExpression(node) {
    handleImportExpression(node, state);
  },
  CallExpression(node) {
    handleCallExpression(node, state);
  },
  NewExpression(node) {
    handleNewExpression(node, state);
  },
  MemberExpression(node) {
    handleMemberExpression(node, state);
  },
  JSXMemberExpression(node) {
    handleJSXMemberExpression(node, state);
  },
  ForInStatement(node) {
    if (node.right.type === 'Identifier') {
      const _import = state.localImportMap.get(node.right.name);
      if (_import?.isNamespace) {
        const internalImport = state.internal.get(_import.filePath);
        if (internalImport) addValue(internalImport.import, OPAQUE, state.filePath);
      }
    }
  },
  ForOfStatement(node) {
    if (node.right.type === 'Identifier') {
      const _import = state.localImportMap.get(node.right.name);
      if (_import?.isNamespace) {
        const internalImport = state.internal.get(_import.filePath);
        if (internalImport) addValue(internalImport.import, OPAQUE, state.filePath);
      }
    }
  },
  TSQualifiedName(node) {
    let left: TSTypeName = node;
    const parts: string[] = [];
    while (left.type === 'TSQualifiedName') {
      if (left.right.type === 'Identifier') parts.unshift(left.right.name);
      left = left.left;
    }
    if (left.type === 'Identifier') {
      const rootName = left.name;
      const _import = state.localImportMap.get(rootName);
      if (_import) {
        const internalImport = state.internal.get(_import.filePath);
        if (internalImport) {
          if (parts.length > 0) {
            let path = '';
            for (const part of parts) {
              path = path ? `${path}.${part}` : part;
              state.addNsMemberRefs(internalImport, rootName, path);
            }
          } else {
            internalImport.refs.add(rootName);
          }
        }
      } else if (parts.length > 0) {
        const exp = state.exports.get(rootName);
        if (exp) {
          for (const member of exp.members) {
            if (member.identifier === parts[0]) member.hasRefsInFile = true;
          }
        }
      }
    }
  },
  TSTypeReference(node) {
    if (node.typeName.type === 'Identifier') {
      const name = node.typeName.name;
      const _import = state.localImportMap.get(name);
      if (_import) {
        const internalImport = state.internal.get(_import.filePath);
        if (internalImport) internalImport.refs.add(name);
      }
    }
  },
  TSTypeQuery(node) {
    if (node.exprName.type === 'Identifier') {
      const name = node.exprName.name;
      const _import = state.localImportMap.get(name);
      if (_import) {
        const internalImport = state.internal.get(_import.filePath);
        if (internalImport) internalImport.refs.add(name);
      }
    }
  },
  TSImportType(node) {
    const src = node.source;
    if (isStringLiteral(src)) {
      const specifier = getStringValue(src)!;
      state.addImport(specifier, undefined, undefined, undefined, src.start, IMPORT_FLAGS.TYPE_ONLY);
    }
  },

  TSImportEqualsDeclaration(node) {
    if (node.moduleReference.type === 'TSExternalModuleReference') {
      const expr = node.moduleReference.expression;
      if (isStringLiteral(expr)) {
        const specifier = getStringValue(expr)!;
        const localName = node.id.name;
        state.addImport(specifier, 'default', localName, undefined, node.id.start, IMPORT_FLAGS.NONE);
        if (localName) {
          const module = state.resolveModule(specifier, state.filePath);
          if (module && !module.isExternalLibraryImport && !isInNodeModules(module.resolvedFileName)) {
            state.localImportMap.set(localName, {
              importedName: 'default',
              filePath: module.resolvedFileName,
              isNamespace: false,
            });
          }
        }
      }
    } else if (node.moduleReference.type === 'TSQualifiedName') {
      const left = node.moduleReference.left;
      const right = node.moduleReference.right;
      if (left.type === 'Identifier' && right.type === 'Identifier') {
        const nsName = left.name;
        const _import = state.localImportMap.get(nsName);
        if (_import?.isNamespace) {
          const internalImport = state.internal.get(_import.filePath);
          if (internalImport) state.addNsMemberRefs(internalImport, nsName, right.name);
        }
      }
    }
  },
};

export function walkAST(program: Program, sourceText: string, filePath: string, ctx: WalkContext) {
  const isJS =
    filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs') || filePath.endsWith('.jsx');

  state = {
    ...ctx,
    filePath,
    sourceText,
    isJS,
    handledImportExpressions: new Set(),
    bareExprRefs: new Set(),
    accessedAliases: new Set(),
    shorthandNsContainers: new Map(),
    accessedShorthandNs: new Set(),
    chainedMemberExprs: new WeakSet(),
    currentVarDeclStart: -1,
    nsRanges: [],
    addExport: _addExport,
    getFix: _getFix,
    getTypeFix: _getTypeFix,
    collectRefsInType: _collectRefsInType,
    isInNamespace: _isInNamespace,
  };

  ctx.visitor.visit(program);

  for (const [aliasName, aliasSet] of state.importAliases) {
    if (!state.accessedAliases.has(aliasName)) {
      for (const alias of aliasSet) {
        const _import = state.localImportMap.get(alias.id);
        if (_import?.isNamespace) {
          const internalImport = state.internal.get(_import.filePath);
          if (internalImport) {
            addValue(internalImport.import, OPAQUE, filePath);
          }
        }
      }
    }
  }

  for (const [containerName, nsSet] of state.shorthandNsContainers) {
    for (const nsName of nsSet) {
      if (!state.accessedShorthandNs.has(`${containerName}.${nsName}`)) {
        const _import = state.localImportMap.get(nsName);
        if (_import) {
          const internalImport = state.internal.get(_import.filePath);
          if (internalImport) {
            addValue(internalImport.import, OPAQUE, filePath);
          }
        }
      }
    }
  }

  if (!state.skipBareExprRefs) {
    for (const name of state.bareExprRefs) {
      const item = state.exports.get(name);
      if (item) item.hasRefsInFile = true;
    }
  }

  state = undefined!;
}
