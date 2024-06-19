import pc from 'picocolors';
import type { Node, Parent } from 'unist';
import { type Visitor, visit } from 'unist-util-visit';

interface LinkNode extends Node {
  url: string;
}

const isLinkNode = (node: Node): node is LinkNode =>
  (node.type === 'link' || node.type === 'definition') && typeof (node as LinkNode).url === 'string';

const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export const fixInternalLinks = () => (tree: Parent) => {
  const visitor: Visitor = node => {
    if (isLinkNode(node) && node.url.startsWith('.')) {
      const url = node.url;
      node.url = url.replace(/\.mdx?(#.+)?$/, '$1');
      console.log(`${pc.dim(dateTimeFormat.format(new Date()))} ${pc.cyan('[fix-link]')} Modify ${url} → ${node.url}`);
    }
  };
  visit(tree, visitor);
};
