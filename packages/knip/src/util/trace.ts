import picocolors from 'picocolors';
import type { MainOptions } from './create-options.js';
import { toRelative } from './path.js';

const IS_ENTRY = ' ◯';
const HAS_REF = ' ✓';
const HAS_NO_REF = ' x';

const getPadding = (level: number, levels: Set<number>) => {
  let padding = '';
  for (let i = 0; i < level; i++) padding += levels.has(i) ? `${picocolors.dim('│')}  ` : '   ';
  return padding;
};

type ExplorerTraceNode = {
  filePath: string;
  identifier?: string;
  hasRef: boolean;
  isEntry: boolean;
  children: ExplorerTraceNode[];
};

const renderExplorerTrace = (node: ExplorerTraceNode, options: MainOptions, level = 0, levels = new Set<number>()) => {
  let index = 0;
  const size = node.children.length;
  const padding = getPadding(level, levels);
  for (const child of node.children) {
    const isLast = ++index === size;
    const hasRef = child.hasRef === true;
    const rel = toRelative(child.filePath, options.cwd);
    const file = hasRef ? rel : picocolors.dim(rel);
    // Only show hasRef marker on child nodes, not entry marker
    const suffix = hasRef ? HAS_REF : '';
    const text = `${padding}${picocolors.dim(isLast ? '└─' : '├─')} ${file}${suffix}`;
    // biome-ignore lint: suspicious
    console.log(text);
    if (child.children.length > 0) {
      if (!isLast) levels.add(level);
      if (isLast) levels.delete(level);
      renderExplorerTrace(child, options, level + 1, levels);
    }
  }
};

export const printTraceNode = (node: ExplorerTraceNode, options: MainOptions) => {
  const suffix = (node.isEntry ? IS_ENTRY : '') + (node.children.length === 0 ? HAS_NO_REF : '');
  const header = `${toRelative(node.filePath, options.cwd)}${node.identifier ? `:${node.identifier}` : ''}${suffix}`;
  // biome-ignore lint: suspicious
  console.log(header);
  renderExplorerTrace(node, options);
  // biome-ignore lint: suspicious
  console.log();
};
