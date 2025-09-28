import picocolors from 'picocolors';
import type { ModuleGraph } from '../types/module-graph.js';
import type { MainOptions } from './create-options.js';
import { toAbsolute, toRelative } from './path.js';

const IS_ENTRY = ' ◯';
const HAS_REF = ' ✓';
const HAS_NO_REF = ' x';

type CreateNodeOpts = {
  identifier?: string;
  hasRef?: boolean;
  isEntry?: boolean;
};

type Create = (filePath: string, options?: CreateNodeOpts) => TraceNode;

export type TraceNode = {
  filePath: string;
  identifier?: string;
  hasRef: boolean;
  isEntry: boolean;
  children: Set<TraceNode>;
};

const getPadding = (level: number, levels: Set<number>) => {
  let padding = '';
  for (let i = 0; i < level; i++) padding += levels.has(i) ? `${picocolors.dim('│')}  ` : '   ';
  return padding;
};

const renderTrace = (node: TraceNode, level = 0, levels = new Set<number>()) => {
  let index = 0;
  const size = node.children.size;
  const padding = getPadding(level, levels);
  for (const child of node.children) {
    const isLast = ++index === size;
    const hasRef = child.hasRef === true;
    const rel = child.filePath;
    const file = hasRef ? rel : picocolors.dim(rel);
    const suffix = (hasRef ? HAS_REF : '') + (child.isEntry ? IS_ENTRY : '');
    const text = `${padding}${picocolors.dim(isLast ? '└─' : '├─')} ${file}${suffix}`;
    // biome-ignore lint: suspicious
    console.log(text);
    if (child.children.size > 0) {
      if (!isLast) levels.add(level);
      if (isLast) levels.delete(level);
      renderTrace(child, level + 1, levels);
    }
  }
};

export const printTrace = (node: TraceNode, filePath: string, options: MainOptions, identifier?: string) => {
  if (!options.isTrace) return;
  if (options.traceExport && identifier && identifier !== options.traceExport) return;
  if (options.traceFile && filePath !== toAbsolute(options.traceFile, options.cwd)) return;
  const suffix = (node.isEntry ? IS_ENTRY : '') + (node.children.size === 0 ? HAS_NO_REF : '');
  const header = `${toRelative(filePath, options.cwd)}${identifier ? `:${identifier}` : ''}${suffix}`;
  // biome-ignore lint: suspicious
  console.log(header);
  renderTrace(node);
  // biome-ignore lint: suspicious
  console.log();
};

export const createNode: Create = (filePath, { hasRef = false, isEntry = false, identifier } = {}) => ({
  filePath,
  identifier,
  hasRef,
  isEntry,
  children: new Set<TraceNode>(),
});

const addNode = (parent: TraceNode, filePath: string, { hasRef = false, isEntry = false }: CreateNodeOpts) => {
  const node = createNode(filePath, { hasRef, isEntry });
  parent.children.add(node);
  return node;
};

export const addNodes = (node: TraceNode, id: string, importedSymbols: ModuleGraph, filePaths?: Set<string>) => {
  if (!filePaths) return;
  for (const filePath of filePaths) {
    addNode(node, filePath, { hasRef: Boolean(importedSymbols.get(filePath)?.traceRefs?.has(id)) });
  }
};

export const createAndPrintTrace = (filePath: string, options: MainOptions, opts: CreateNodeOpts = {}) => {
  if (!options.isTrace) return;
  const traceNode = createNode(filePath, opts);
  printTrace(traceNode, filePath, options, opts.identifier);
};
