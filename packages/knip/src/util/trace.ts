import pc from 'picocolors';
import type { TreeNode } from '../graph-explorer/operations/build-exports-tree.js';

export const formatTrace = (node: TreeNode, toRelative: (path: string) => string, isReferenced: boolean): string => {
  const lines: string[] = [];

  const dim = pc.dim;
  const file = pc.white;
  const id = pc.cyanBright;
  const via = pc.dim;
  const ref = pc.cyanBright;
  const ok = pc.green;
  const fail = pc.red;

  const entryMarker = node.isEntry ? dim(' ◯') : '';
  lines.push(`${file(toRelative(node.filePath))}${dim(':')}${id(node.identifier)}${entryMarker}`);

  const formatVia = (child: TreeNode): string => {
    if (!child.via) return id(child.identifier);
    const parts = child.identifier.split('.');
    const name = parts[0];
    const rest = parts.slice(1).join('.');
    const nameDisplay = child.originalId ? `${id(child.originalId)}${dim(' → ')}${id(name)}` : id(name);
    return `${via(child.via)}${dim('[')}${nameDisplay}${rest ? `${dim('.')}${id(rest)}` : ''}${dim(']')}`;
  };

  const isReExport = (via: string | undefined) =>
    via?.startsWith('reExport') ?? false;

  const formatChild = (child: TreeNode, prefix: string, isLast: boolean) => {
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    const entryMarker = child.isEntry ? dim(' ◯') : '';
    const isLeaf = child.children.length === 0;
    const showLeafMarker = isLeaf && !isReExport(child.via);
    const leafMarker = showLeafMarker ? (isReferenced ? ok(' ✓') : fail(' ✗')) : '';

    lines.push(
      `${dim(prefix)}${dim(connector)}${file(toRelative(child.filePath))}${dim(':')}${formatVia(child)}${entryMarker}${leafMarker}`
    );

    if (child.refs.length > 0) {
      const refsPrefix = isLeaf ? ' ' : '│';
      lines.push(
        `${dim(prefix)}${dim(childPrefix)}${dim(refsPrefix)} ${dim('refs: [')}${child.refs.map(r => ref(r)).join(dim(', '))}${dim(']')}`
      );
    }

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
