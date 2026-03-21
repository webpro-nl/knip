import { isBuiltin } from 'node:module';
import type { ParseResult, Visitor } from 'oxc-parser';
import { IMPORT_FLAGS, IMPORT_STAR, OPAQUE, PROTOCOL_VIRTUAL, SIDE_EFFECTS } from '../constants.ts';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile, PluginVisitorContext } from '../types/config.ts';
import type { IssueSymbol, SymbolType } from '../types/issues.ts';
import type { Export, FileNode, ImportMap, ImportMaps, Imports } from '../types/module-graph.ts';
import { addNsValue, addValue, createImports } from '../util/module-graph.ts';
import { getPackageNameFromFilePath, isStartsLikePackageName, sanitizeSpecifier } from '../util/modules.ts';
import { timerify } from '../util/Performance.ts';
import { dirname, isInNodeModules, resolve } from '../util/path.ts';
import { shouldIgnore } from '../util/tag.ts';
import {
  buildLineStarts,
  getLineAndCol,
  parseFile,
  shouldCountRefs,
  stripQuotes,
  type ResolveModule,
  type ResolvedModule,
} from './visitors/helpers.ts';
import { buildJSDocTagLookup } from './visitors/jsdoc.ts';
import { walkAST } from './visitors/walk.ts';

const jsDocImportRe = /import\(\s*['"]([^'"]+)['"]\s*\)(?:\.(\w+))?/g;
const jsDocImportTagRe = /@import\s+(?:\{[^}]*\}|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
const jsxImportSourceRe = /@jsxImportSource\s+(\S+)/;
const referenceTypesRe = /\/\s*<reference\s+types\s*=\s*"([^"]+)"\s*\/>/;
const envRe = /@(?:vitest|jest)-environment\s+(\S+)/g;

interface AddInternalImportOptions {
  specifier: string;
  identifier: string | undefined;
  alias: string | undefined;
  namespace: string | undefined;
  filePath: string;
  pos: number;
  line: number;
  col: number;
  modifiers: number;
}

const getImportsAndExports = (
  filePath: string,
  sourceText: string,
  resolveModule: ResolveModule,
  options: GetImportsAndExportsOptions,
  ignoreExportsUsedInFile: IgnoreExportsUsedInFile,
  skipExportsForFile: boolean,
  visitor: Visitor,
  pluginCtx: PluginVisitorContext | undefined,
  cachedParseResult?: ParseResult
): FileNode => {
  const skipExports = skipExportsForFile || !options.isReportExports;
  const internal: ImportMap = new Map();
  const external: Imports = new Set();
  const unresolved: Imports = new Set();
  const programFiles = new Set<string>();
  const entryFiles = new Set<string>();
  const imports: Imports = new Set();
  const exports = new Map<string, Export>();
  const aliasedExports = new Map<string, IssueSymbol[]>();
  const specifierExportNames = new Set<string>();
  const scripts = new Set<string>();

  const importAliases = new Map<string, Set<{ id: string; filePath: string }>>();
  const addImportAlias = (aliasName: string, id: string, importFilePath: string) => {
    const aliases = importAliases.get(aliasName);
    if (aliases) aliases.add({ id, filePath: importFilePath });
    else importAliases.set(aliasName, new Set([{ id, filePath: importFilePath }]));
  };

  const localImportMap = new Map<
    string,
    { importedName: string; filePath: string; isNamespace: boolean; isDynamicImport?: boolean }
  >();
  const localDeclarationTypes = new Map<string, SymbolType>();
  const referencedInExport = new Map<string, Set<string>>();
  const destructuredExports = new Set<string>();

  const addNsMemberRefs = (internalImport: ImportMaps, namespace: string, member: string | string[]) => {
    if (typeof member === 'string') {
      internalImport.refs.add(`${namespace}.${member}`);
    } else {
      for (const m of member) internalImport.refs.add(`${namespace}.${m}`);
    }
  };

  const addInternalImport = (opts: AddInternalImportOptions) => {
    const { filePath: importFilePath, namespace, specifier, modifiers } = opts;
    const identifier = opts.identifier ?? (modifiers & IMPORT_FLAGS.OPAQUE ? OPAQUE : SIDE_EFFECTS);
    const isStar = identifier === IMPORT_STAR;

    imports.add({
      filePath: importFilePath,
      specifier,
      identifier: namespace ?? opts.identifier,
      pos: opts.pos,
      line: opts.line,
      col: opts.col,
      isTypeOnly: !!(modifiers & IMPORT_FLAGS.TYPE_ONLY),
    });

    const file = internal.get(importFilePath);
    const importMaps = file ?? createImports();
    if (!file) internal.set(importFilePath, importMaps);

    const nsOrAlias = opts.alias;

    if (modifiers & IMPORT_FLAGS.RE_EXPORT) {
      if (isStar && namespace) {
        addValue(importMaps.reExportNs, namespace, filePath);
      } else if (nsOrAlias) {
        addNsValue(importMaps.reExportAs, identifier, nsOrAlias, filePath);
      } else {
        addValue(importMaps.reExport, identifier, filePath);
      }
    } else {
      if (nsOrAlias && nsOrAlias !== identifier) {
        if (isStar) {
          addValue(importMaps.importNs, nsOrAlias, filePath);
        } else {
          addNsValue(importMaps.importAs, identifier, nsOrAlias, filePath);
        }
      } else if (identifier !== IMPORT_STAR) {
        addValue(importMaps.import, identifier, filePath);
      }
    }
  };

  const addImport = (
    specifier: string,
    identifier: string | undefined,
    alias: string | undefined,
    namespace: string | undefined,
    pos: number,
    modifiers: number,
    specifierPos?: number,
    jsDocTags?: Set<string>,
    preResolvedModule?: ResolvedModule | undefined
  ) => {
    if (!specifier || isBuiltin(specifier)) return;

    const module = preResolvedModule ?? resolveModule(specifier, filePath);

    if (module) {
      const resolvedFileName = module.resolvedFileName;
      if (resolvedFileName) {
        if (!isInNodeModules(resolvedFileName)) {
          if (modifiers & IMPORT_FLAGS.ENTRY) entryFiles.add(resolvedFileName);
          if (modifiers & IMPORT_FLAGS.BRIDGE) programFiles.add(resolvedFileName);
        }

        if (!module.isExternalLibraryImport || !isInNodeModules(resolvedFileName)) {
          const { line, col } = getLineAndCol(lineStarts, pos);
          addInternalImport({
            identifier,
            alias,
            namespace,
            filePath: resolvedFileName,
            specifier,
            pos,
            line,
            col,
            modifiers,
          });
        }

        if (module.isExternalLibraryImport) {
          if (options.skipTypeOnly && modifiers & IMPORT_FLAGS.TYPE_ONLY) return;

          const sanitizedSpecifier = sanitizeSpecifier(
            isInNodeModules(resolvedFileName) || isInNodeModules(specifier)
              ? getPackageNameFromFilePath(specifier)
              : specifier
          );

          if (!isStartsLikePackageName(sanitizedSpecifier)) return;

          const ePos = specifierPos ?? pos;
          const { line, col } = getLineAndCol(lineStarts, ePos);
          external.add({
            filePath: resolvedFileName,
            specifier: sanitizedSpecifier,
            identifier: identifier ?? SIDE_EFFECTS,
            pos: ePos,
            line,
            col,
            isTypeOnly: !!(modifiers & IMPORT_FLAGS.TYPE_ONLY),
          });
        }
      }
    } else {
      if (options.skipTypeOnly && modifiers & IMPORT_FLAGS.TYPE_ONLY) return;
      if (specifier.startsWith(PROTOCOL_VIRTUAL)) return;

      if (modifiers && modifiers & IMPORT_FLAGS.OPTIONAL) {
        programFiles.add(resolve(dirname(filePath), specifier));
        return;
      }

      const uPos = specifierPos ?? pos;
      const { line, col } = getLineAndCol(lineStarts, uPos);
      if (!(jsDocTags?.size && shouldIgnore(jsDocTags, options.tags))) {
        unresolved.add({
          filePath: undefined,
          specifier,
          identifier: identifier ?? SIDE_EFFECTS,
          pos: uPos,
          line,
          col,
          isTypeOnly: !!(modifiers & IMPORT_FLAGS.TYPE_ONLY),
        });
      }
    }
  };

  const result = cachedParseResult ?? parseFile(filePath, sourceText);
  const lineStarts = buildLineStarts(sourceText);
  const getJSDocTags = buildJSDocTagLookup(result.comments, sourceText);

  let hasNodeModuleImport = false;

  for (const _imports of result.module.staticImports) {
    const specifier = _imports.moduleRequest.value;
    if (specifier === 'node:module' || specifier === 'module') hasNodeModuleImport = true;
    const pos = _imports.moduleRequest.start;
    const jsdocTags = getJSDocTags(_imports.start);

    if (_imports.entries.length === 0) {
      addImport(specifier, undefined, undefined, undefined, pos, IMPORT_FLAGS.SIDE_EFFECTS, undefined, jsdocTags);
      continue;
    }

    const resolved = resolveModule(specifier, filePath);
    const internalPath =
      resolved && !resolved.isExternalLibraryImport && !isInNodeModules(resolved.resolvedFileName)
        ? resolved.resolvedFileName
        : undefined;

    for (const entry of _imports.entries) {
      const modifiers = entry.isType ? IMPORT_FLAGS.TYPE_ONLY : IMPORT_FLAGS.NONE;

      if (entry.importName.kind === 'NamespaceObject') {
        const localName = entry.localName.value;
        addImport(
          specifier,
          IMPORT_STAR,
          localName,
          undefined,
          entry.localName.start,
          modifiers,
          pos,
          jsdocTags,
          resolved
        );
        if (internalPath)
          localImportMap.set(localName, { importedName: IMPORT_STAR, filePath: internalPath, isNamespace: true });
      } else if (entry.importName.kind === 'Default') {
        const localName = entry.localName.value;
        const alias = localName !== 'default' ? localName : undefined;
        addImport(specifier, 'default', alias, undefined, entry.localName.start, modifiers, pos, jsdocTags, resolved);
        if (internalPath)
          localImportMap.set(localName, { importedName: 'default', filePath: internalPath, isNamespace: false });
      } else {
        const importedName = entry.importName.name!;
        const localName = entry.localName.value;
        const alias = localName !== importedName ? localName : undefined;
        addImport(
          specifier,
          importedName,
          alias,
          undefined,
          entry.localName.start,
          modifiers,
          pos,
          jsdocTags,
          resolved
        );
        if (internalPath) localImportMap.set(localName, { importedName, filePath: internalPath, isNamespace: false });
      }
    }
  }

  for (const se of result.module.staticExports) {
    const jsdocTags = getJSDocTags(se.start);
    let reExportResolved: ResolvedModule | undefined;
    let reExportSpecifier: string | undefined;
    for (const entry of se.entries) {
      if (entry.moduleRequest) {
        const specifier = entry.moduleRequest.value;
        const modifiers = IMPORT_FLAGS.RE_EXPORT | (entry.isType ? IMPORT_FLAGS.TYPE_ONLY : IMPORT_FLAGS.NONE);
        const pos = entry.moduleRequest.start;
        if (specifier !== reExportSpecifier) {
          reExportSpecifier = specifier;
          reExportResolved = resolveModule(specifier, filePath);
        }
        if (entry.importName.kind === 'AllButDefault') {
          addImport(
            specifier,
            IMPORT_STAR,
            undefined,
            undefined,
            pos,
            modifiers,
            undefined,
            jsdocTags,
            reExportResolved
          );
        } else if (entry.importName.kind === 'All') {
          const ns = entry.exportName.name!;
          addImport(specifier, IMPORT_STAR, undefined, ns, entry.start, modifiers, pos, jsdocTags, reExportResolved);
        } else if (entry.importName.kind === 'Name') {
          const importedName = entry.importName.name!;
          const exportedName = entry.exportName.name;
          const alias = exportedName && exportedName !== importedName ? exportedName : undefined;
          addImport(
            specifier,
            importedName,
            alias,
            undefined,
            entry.start,
            modifiers,
            pos,
            undefined,
            reExportResolved
          );
        }
        continue;
      }

      if (skipExports) continue;
    }
  }

  if (pluginCtx) {
    pluginCtx.filePath = filePath;
    pluginCtx.sourceText = sourceText;
    pluginCtx.addScript = (s: string) => scripts.add(s);
    pluginCtx.addImport = (spec: string, pos: number, mod: number) =>
      addImport(spec, undefined, undefined, undefined, pos, mod);
  }

  const localRefs = walkAST(result.program, sourceText, filePath, {
    lineStarts,
    skipExports,
    options,
    exports,
    aliasedExports,
    specifierExportNames,
    scripts,
    addImport,
    addNsMemberRefs,
    addImportAlias,
    internal,
    localImportMap,
    localDeclarationTypes,
    importAliases,
    referencedInExport,
    skipBareExprRefs: !!ignoreExportsUsedInFile,
    localRefs: ignoreExportsUsedInFile ? new Set() : undefined,
    destructuredExports,
    hasNodeModuleImport,
    resolveModule,
    programFiles,
    entryFiles,
    visitor,
    getJSDocTags,
  });

  for (const comment of result.comments) {
    const text = comment.value;

    let results: RegExpExecArray | null;
    if (comment.type === 'Block') {
      jsDocImportRe.lastIndex = 0;
      while ((results = jsDocImportRe.exec(text)) !== null) {
        const before = text.slice(0, results.index);
        const lastOpen = before.lastIndexOf('{');
        if (lastOpen === -1 || before.indexOf('}', lastOpen) !== -1) continue;
        const specifier = results[1];
        const member = results[2];
        addImport(specifier, member, undefined, undefined, comment.start + results.index, IMPORT_FLAGS.TYPE_ONLY);
      }

      jsDocImportTagRe.lastIndex = 0;
      while ((results = jsDocImportTagRe.exec(text)) !== null) {
        const specifier = results[1];
        addImport(specifier, undefined, undefined, undefined, comment.start + results.index, IMPORT_FLAGS.TYPE_ONLY);
      }
    }

    const jsxMatch = text.match(jsxImportSourceRe);
    if (jsxMatch) {
      addImport(jsxMatch[1], undefined, undefined, undefined, comment.start, IMPORT_FLAGS.TYPE_ONLY);
    }

    envRe.lastIndex = 0;
    while ((results = envRe.exec(text)) !== null) {
      const id = stripQuotes(results[1]);
      if (!id) continue;
      const isLocal = id.startsWith('.') || id.startsWith('/');
      const modifiers = isLocal ? IMPORT_FLAGS.ENTRY : IMPORT_FLAGS.NONE;
      addImport(id, undefined, undefined, undefined, comment.start + results.index, modifiers);
    }

    if (comment.type === 'Line') {
      const refMatch = ('/' + comment.value).match(referenceTypesRe);
      if (refMatch) {
        addImport(refMatch[1], undefined, undefined, undefined, comment.start, IMPORT_FLAGS.TYPE_ONLY);
      }
    }
  }

  for (const [id, item] of exports) {
    item.referencedIn = referencedInExport.get(id);
    if (localRefs && shouldCountRefs(ignoreExportsUsedInFile, item.type) && (localRefs.has(id) || item.isReExport)) {
      item.hasRefsInFile = true;
    }
  }

  return {
    imports: { internal, external, externalRefs: new Set(), programFiles, entryFiles, imports, unresolved },
    exports,
    duplicates: [...aliasedExports.values()],
    scripts,
    importedBy: undefined,
    internalImportCache: undefined,
  };
};

export const _getImportsAndExports = timerify(getImportsAndExports);
