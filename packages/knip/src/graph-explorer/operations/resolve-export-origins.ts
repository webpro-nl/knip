import { isBuiltin } from 'node:module';
import { IMPORT_FLAGS, IMPORT_STAR } from '../../constants.ts';
import type { FileNode, Import, ModuleGraph } from '../../types/module-graph.ts';
import { getCachedExportTable, setCachedExportTable } from '../cache.ts';
import {
  forEachAliasReExport,
  forEachNamespaceReExport,
  forEachPassThroughReExport,
  getStarReExportSources,
} from '../visitors.ts';

export interface ExportOrigin {
  filePath: string;
  identifier: string;
}

export interface ExportOriginResolution {
  origins: ExportOrigin[];
  hasExplicitExport: boolean;
}

export interface ExportTableEntry {
  origins: ReadonlyMap<string, ExportOrigin>;
  hasExplicitExport: boolean;
}

export type ExportTable = Map<string, ExportTableEntry>;

export interface ExportTableCache {
  entries: ExportTable;
  complete: boolean;
}

interface ExportInfo {
  node: FileNode | undefined;
  references: Map<string, ExportOrigin[]>;
  terminals: Map<string, ExportOrigin[]>;
  stars: string[];
}

interface Query {
  filePath: string;
  info: ExportInfo;
  names: Set<string>;
  all: boolean;
  entries: ExportTable;
  dependents: Map<Query, { star: boolean; aliases: Map<string, Set<string>> }>;
  pending: Set<string>;
}

const originKey = (origin: ExportOrigin) => origin.filePath + '\0' + origin.identifier;
const isExplicit = (info: ExportInfo, name: string) => info.node?.exports.has(name) || info.terminals.has(name);

export const createExportResolver = (graph: ModuleGraph) => {
  const infos = new Map<string, ExportInfo>();

  const getInfo = (filePath: string): ExportInfo => {
    const cached = infos.get(filePath);
    if (cached) return cached;
    const node = graph.get(filePath);
    const info: ExportInfo = { node, references: new Map(), terminals: new Map(), stars: [] };
    infos.set(filePath, info);
    if (!node) return info;

    const add = (map: Map<string, ExportOrigin[]>, name: string, origin: ExportOrigin) => {
      const list = map.get(name);
      if (list) list.push(origin);
      else map.set(name, [origin]);
    };

    for (const [sourcePath, imports] of node.imports.internal) {
      if (getStarReExportSources(imports)) info.stars.push(sourcePath);
      forEachNamespaceReExport(imports, name => {
        const exp = node.exports.get(name);
        if (!exp || exp.isBindingReExport) add(info.terminals, name, { filePath: sourcePath, identifier: IMPORT_STAR });
      });
      forEachPassThroughReExport(imports, name => {
        if (node.exports.get(name)?.isBindingReExport)
          add(info.references, name, { filePath: sourcePath, identifier: name });
      });
      forEachAliasReExport(imports, (identifier, alias) => {
        if (node.exports.get(alias)?.isBindingReExport)
          add(info.references, alias, { filePath: sourcePath, identifier });
      });
    }

    const addExternal = (record: Import) => {
      if (!(record.modifiers & IMPORT_FLAGS.RE_EXPORT) || !record.identifier) return;
      const name = record.alias ?? record.identifier;
      const exp = node.exports.get(name);
      if (
        (!exp && !(record.identifier === IMPORT_STAR && record.alias)) ||
        (record.isTypeOnly && exp && !exp.isBindingReExport) ||
        info.references.has(name)
      )
        return;
      add(info.terminals, name, { filePath: record.specifier, identifier: record.identifier });
    };
    for (const record of node.imports.external) addExternal(record);
    for (const record of node.imports.imports) if (isBuiltin(record.specifier)) addExternal(record);
    return info;
  };

  const build = (filePath: string, identifier?: string) => {
    const states = new Map<string, Query>();
    const discovery: Array<[Query, string | undefined]> = [];
    const updates: Query[] = [];

    const request = (path: string, name?: string): Query => {
      let state = states.get(path);
      if (!state) {
        state = {
          filePath: path,
          info: getInfo(path),
          names: new Set(),
          all: false,
          entries: new Map(),
          dependents: new Map(),
          pending: new Set(),
        };
        states.set(path, state);
      }
      if (state.all || (name !== undefined && state.names.has(name))) return state;
      if (name === undefined) state.all = true;
      else state.names.add(name);
      discovery.push([state, name]);
      return state;
    };

    const merge = (state: Query, name: string, origins: ReadonlyMap<string, ExportOrigin>) => {
      let entry = state.entries.get(name);
      let changed = false;
      if (!entry) {
        entry = { origins, hasExplicitExport: !!isExplicit(state.info, name) };
        state.entries.set(name, entry);
        changed = origins.size > 0;
      } else if (entry.origins.size === 0) {
        entry.origins = origins;
        changed = origins.size > 0;
      } else {
        let merged: Map<string, ExportOrigin> | undefined;
        for (const [key, origin] of origins) {
          if (!entry.origins.has(key)) (merged ??= new Map(entry.origins)).set(key, origin);
        }
        if (merged) {
          entry.origins = merged;
          changed = true;
        }
      }
      if (changed) {
        if (state.pending.size === 0) updates.push(state);
        state.pending.add(name);
      }
    };

    const connect = (source: Query, target: Query, sourceName?: string, targetName?: string) => {
      let edge = source.dependents.get(target);
      if (!edge) source.dependents.set(target, (edge = { star: false, aliases: new Map() }));
      if (sourceName === undefined || targetName === undefined) edge.star = true;
      else {
        let aliases = edge.aliases.get(sourceName);
        if (!aliases) edge.aliases.set(sourceName, (aliases = new Set()));
        aliases.add(targetName);
      }
    };

    request(filePath, identifier);
    for (let index = 0; index < discovery.length; index++) {
      const [state, name] = discovery[index];
      const cached = getCachedExportTable(graph, state.filePath);
      if (name === undefined && cached?.complete) {
        for (const [id, entry] of cached.entries) merge(state, id, entry.origins);
        continue;
      }
      const seed = (id: string) => {
        const entry = cached?.entries.get(id);
        if (entry) {
          merge(state, id, entry.origins);
          return;
        }
        const terminals = state.info.terminals.get(id);
        const references = state.info.references.get(id);
        const exp = state.info.node?.exports.get(id);
        if (terminals || exp) {
          const origins = new Map<string, ExportOrigin>();
          if (terminals) for (const origin of terminals) origins.set(originKey(origin), origin);
          else if (exp && !exp.isBindingReExport) {
            const origin = { filePath: state.filePath, identifier: exp.binding };
            origins.set(originKey(origin), origin);
          }
          merge(state, id, origins);
        }
        if (references)
          for (const source of references)
            connect(request(source.filePath, source.identifier), state, source.identifier, id);
      };
      if (name === undefined) {
        if (state.info.node) for (const id of state.info.node.exports.keys()) seed(id);
        for (const id of state.info.terminals.keys()) if (!state.info.node?.exports.has(id)) seed(id);
        for (const source of state.info.stars) connect(request(source), state);
      } else {
        seed(name);
        if (cached?.complete || cached?.entries.has(name) || isExplicit(state.info, name) || name === 'default')
          continue;
        for (const source of state.info.stars) connect(request(source, name), state);
      }
    }

    for (let index = 0; index < updates.length; index++) {
      const state = updates[index];
      const names = state.pending;
      state.pending = new Set();
      for (const [target, edge] of state.dependents) {
        for (const name of names) {
          const entry = state.entries.get(name);
          if (!entry) continue;
          if (
            edge.star &&
            name !== 'default' &&
            !isExplicit(target.info, name) &&
            (target.all || target.names.has(name))
          )
            merge(target, name, entry.origins);
          const aliases = edge.aliases.get(name);
          if (aliases) for (const alias of aliases) merge(target, alias, entry.origins);
        }
      }
    }

    for (const state of states.values()) {
      const cached = getCachedExportTable(graph, state.filePath);
      if (cached && !state.all) {
        for (const [name, entry] of state.entries) cached.entries.set(name, entry);
      } else setCachedExportTable(graph, state.filePath, { entries: state.entries, complete: state.all });
    }
  };

  const getTable = (filePath: string): ExportTable => {
    if (!getCachedExportTable(graph, filePath)?.complete) build(filePath);
    return getCachedExportTable(graph, filePath)?.entries ?? new Map();
  };

  const resolve = (filePath: string, identifier: string): ExportTableEntry | undefined => {
    const cached = getCachedExportTable(graph, filePath);
    if (!cached?.complete && !cached?.entries.has(identifier)) build(filePath, identifier);
    return getCachedExportTable(graph, filePath)?.entries.get(identifier);
  };

  const getSources = (filePath: string, identifier: string): ExportOrigin[] => {
    const info = getInfo(filePath);
    if (isExplicit(info, identifier)) return info.references.get(identifier) ?? [];
    return identifier === 'default' ? [] : info.stars.map(source => ({ filePath: source, identifier }));
  };

  const reachesOrigin = (source: ExportOrigin, origin: ExportOrigin, site: ExportOrigin): boolean => {
    const visited = new Set([originKey(site)]);
    const queue = [source];
    const key = originKey(origin);
    for (let index = 0; index < queue.length; index++) {
      const current = queue[index];
      const currentKey = originKey(current);
      if (visited.has(currentKey)) continue;
      visited.add(currentKey);
      if (current.identifier === IMPORT_STAR && currentKey === key) return true;
      const info = getInfo(current.filePath);
      const exp = info.node?.exports.get(current.identifier);
      if (info.terminals.get(current.identifier)?.some(value => originKey(value) === key)) return true;
      if (exp && !exp.isBindingReExport && originKey({ filePath: current.filePath, identifier: exp.binding }) === key)
        return true;
      queue.push(...getSources(current.filePath, current.identifier));
    }
    return false;
  };

  return { getTable, resolve, getInfo, reachesOrigin };
};

export const resolveExportOrigins = (
  graph: ModuleGraph,
  filePath: string,
  identifier: string
): ExportOriginResolution => {
  const entry = createExportResolver(graph).resolve(filePath, identifier);
  return { origins: entry ? [...entry.origins.values()] : [], hasExplicitExport: entry?.hasExplicitExport ?? false };
};
