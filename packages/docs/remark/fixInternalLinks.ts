import { bold, cyan, dim } from 'kleur/colors';
import { visit, type Visitor } from 'unist-util-visit';
import type { Node, Parent } from 'unist';

interface LinkNode extends Node {
  url: string;
}

const isLinkNode = (node: Node): node is LinkNode =>
  (node.type === 'link' || node.type === 'definition') && typeof (node as LinkNode).url === 'string';

const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export const fixInternalLinks = () => (tree: Parent) => {
  const visitor: Visitor = node => {
    if (isLinkNode(node) && node.url.startsWith('.')) {
      const url = node.url;
      node.url = url.replace(/\.mdx?(#.+)?$/, '$1');
      console.log(`${dim(dateTimeFormat.format(new Date()))} ${bold(cyan('[fix-link]'))} Modify ${url} → ${node.url}`);
    }
  };
  visit(tree, visitor);
};
