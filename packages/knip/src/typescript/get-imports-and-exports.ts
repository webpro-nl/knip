import { isBuiltin } from 'node:module';
import type { ParseResult, Visitor } from 'oxc-parser';
import { IMPORT_FLAGS, IMPORT_STAR, OPAQUE, PROTOCOL_VIRTUAL, SIDE_EFFECTS } from '../constants.ts';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile, PluginVisitorContext } from '../types/config.ts';
import type { IssueSymbol, SymbolType } from '../types/issues.ts';
import type { Export, FileNode, ImportGlob, ImportMap, ImportMaps, Imports } from '../types/module-graph.ts';
import { addNsValue, addValue, createImports } from '../util/module-graph.ts';
import {
  getPackageNameFromFilePath,
  getPackageNameFromModuleSpecifier,
  isStartsLikePackageName,
  sanitizeSpecifier,
} from '../util/modules.ts';
import { timerify } from '../util/Performance.ts';
import { dirname, isInNodeModules, resolve } from '../util/path.ts';
import { shouldIgnore } from '../util/tag.ts';
import { extractImportsFromComments } from './comments.ts';
import {
  _parseFile,
  buildLineStarts,
  getLineAndCol,
  shouldCountRefs,
  type ResolveModule,
  type ResolvedModule,
} from './ast-nodes.ts';
import { buildJSDocTagLookup } from './visitors/jsdoc.ts';
import { _walkAST } from './visitors/walk.ts';

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

const EMPTY_CHILD_PROCESS_NAMES: ReadonlySet<string> = new Set();
const EMPTY_CHILD_PROCESS_METHODS: ReadonlyMap<string, string> = new Map();

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
  const isDts = filePath.endsWith('.d.ts') || filePath.endsWith('.d.cts') || filePath.endsWith('.d.mts');
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
  const importGlobs: ImportGlob[] = [];

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
  // Local class names kept alive by an in-module runtime registration: the native
  // `customElements.define` (handled in core) and framework decorators like Lit's
  // `@customElement` (contributed by plugins via `pluginCtx.markExportRegistered`).
  const registeredCustomElements = new Set<string>();

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
      isTypeOnly: isDts || !!(modifiers & IMPORT_FLAGS.TYPE_ONLY),
      modifiers,
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

    if (
      modifiers & IMPORT_FLAGS.AUGMENT &&
      (!module || module.isExternalLibraryImport || isInNodeModules(module.resolvedFileName))
    ) {
      return;
    }

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

          let sanitizedSpecifier = sanitizeSpecifier(
            isInNodeModules(specifier) ? getPackageNameFromFilePath(specifier) : specifier
          );
          if (
            module.packageName &&
            isStartsLikePackageName(module.packageName) &&
            getPackageNameFromModuleSpecifier(sanitizedSpecifier) !== module.packageName
          ) {
            sanitizedSpecifier = module.packageName;
          }

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
            isTypeOnly: isDts || !!(modifiers & IMPORT_FLAGS.TYPE_ONLY),
            modifiers,
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
          isTypeOnly: isDts || !!(modifiers & IMPORT_FLAGS.TYPE_ONLY),
          modifiers,
        });
      }
    }
  };

  const result = cachedParseResult ?? _parseFile(filePath, sourceText);
  const lineStarts = buildLineStarts(sourceText);
  const getJSDocTags = buildJSDocTagLookup(result.comments, sourceText);

  let hasNodeModuleImport = false;
  let hasWorkerThreadsImport = false;
  let hasChildProcessImport = false;
  let hasPathJoinImport = false;
  let hasPathResolveImport = false;
  let childProcessNamespaces: Set<string> | undefined;
  let childProcessMethods: Map<string, string> | undefined;

  for (const _imports of result.module.staticImports) {
    const specifier = _imports.moduleRequest.value;
    const isPathImport = specifier === 'node:path' || specifier === 'path';
    const isChildProcessImport = specifier === 'node:child_process' || specifier === 'child_process';
    if (specifier === 'node:module' || specifier === 'module') hasNodeModuleImport = true;
    else if (specifier === 'node:worker_threads' || specifier === 'worker_threads') hasWorkerThreadsImport = true;
    else if (isChildProcessImport) hasChildProcessImport = true;
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
        if (isChildProcessImport) (childProcessNamespaces ??= new Set()).add(localName);
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
        if (isChildProcessImport) (childProcessNamespaces ??= new Set()).add(localName);
        const alias = localName !== 'default' ? localName : undefined;
        addImport(specifier, 'default', alias, undefined, entry.localName.start, modifiers, pos, jsdocTags, resolved);
        if (internalPath)
          localImportMap.set(localName, { importedName: 'default', filePath: internalPath, isNamespace: false });
      } else {
        const importedName = entry.importName.name!;
        const localName = entry.localName.value;
        const alias = localName !== importedName ? localName : undefined;
        if (isChildProcessImport) (childProcessMethods ??= new Map()).set(localName, importedName);
        if (isPathImport && !alias) {
          if (importedName === 'join') hasPathJoinImport = true;
          else if (importedName === 'resolve') hasPathResolveImport = true;
        }
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
    pluginCtx.addImportGlob = (patterns, opts) =>
      importGlobs.push({ patterns, base: opts?.base, filter: opts?.filter });
    pluginCtx.markExportRegistered = (name: string) => registeredCustomElements.add(name);
  }

  const localRefs = _walkAST(result.program, sourceText, filePath, result.module.hasModuleSyntax, {
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
    hasWorkerThreadsImport,
    hasChildProcessImport,
    childProcessNamespaces: childProcessNamespaces ?? EMPTY_CHILD_PROCESS_NAMES,
    childProcessMethods: childProcessMethods ?? EMPTY_CHILD_PROCESS_METHODS,
    registeredCustomElements,
    hasPathJoinImport,
    hasPathResolveImport,
    resolveModule,
    programFiles,
    entryFiles,
    visitor,
    getJSDocTags,
  });

  const firstStmtStart = result.program.body[0]?.start ?? Number.POSITIVE_INFINITY;
  extractImportsFromComments(result.comments, firstStmtStart, addImport);

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
    importGlobs,
    importedBy: undefined,
    internalImportCache: undefined,
  };
};

export const _getImportsAndExports = timerify(getImportsAndExports);
