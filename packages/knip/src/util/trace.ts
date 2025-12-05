import pc from 'picocolors';
import type { TreeNode } from '../graph-explorer/operations/build-trace-tree.js';

export const formatTrace = (node: TreeNode, toRelative: (path: string) => string, isReferenced: boolean): string => {
  const lines: string[] = [];

  const dim = pc.dim;
  const file = pc.white;
  const id = pc.cyanBright;
  const via = pc.green;
  const ref = pc.cyan;
  const ok = pc.green;
  const fail = pc.red;

  const entryMarker = node.isEntry ? dim(' ◯') : '';
  lines.push(`${file(toRelative(node.filePath))}${dim(':')}${id(node.identifier)}${entryMarker}`);

  const formatVia = (child: TreeNode): string => {
    if (!child.via) return id(child.identifier);
    const parts = child.identifier.split('.');
    const name = parts[0];
    const rest = parts.slice(1).join('.');
    const nameDisplay = child.originalName ? `${id(child.originalName)}${dim(' → ')}${id(name)}` : id(name);
    return `${via(child.via)}${dim('[')}${nameDisplay}${rest ? `${dim('.')}${id(rest)}` : ''}${dim(']')}`;
  };

  const formatChild = (child: TreeNode, prefix: string, isLast: boolean) => {
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    const entryMarker = child.isEntry ? dim(' ◯') : '';
    const isLeaf = child.children.length === 0;
    const leafMarker = isLeaf ? (isReferenced ? ok(' ✓') : fail(' ✗')) : '';

    lines.push(
      `${dim(prefix)}${dim(connector)}${file(toRelative(child.filePath))}${dim(':')}${formatVia(child)}${entryMarker}${leafMarker}`
    );

    const refsPrefix = isLeaf ? ' ' : '│';
    lines.push(
      `${dim(prefix)}${dim(childPrefix)}${dim(refsPrefix)} ${dim('refs: [')}${child.refs.map(r => ref(r)).join(dim(', '))}${dim(']')}`
    );

    for (let i = 0; i < child.children.length; i++) {
      formatChild(child.children[i], prefix + childPrefix, i === child.children.length - 1);
    }
  };

  for (let i = 0; i < node.children.length; i++) {
    formatChild(node.children[i], '', i === node.children.length - 1);
  }

  if (node.children.length === 0) {
    const leafMarker = isReferenced ? ok(' ✓') : fail(' ✗');
    lines.push(`${dim('└── (no imports found)')}${leafMarker}`);
  }

  return lines.join('\n');
};
