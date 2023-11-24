import { h } from 'hastscript';
import { visit, type Visitor } from 'unist-util-visit';
import type { Parent } from 'unist';

export const transformDirectives = () => (tree: Parent) => {
  const visitor: Visitor = (node, index, parent) => {
    if (node.type === 'textDirective' || node.type === 'leafDirective' || node.type === 'containerDirective') {
      const hast = h(node.name, node.attributes);
      const data = node.data || (node.data = {});
      data.hName = hast.tagName;
      data.hProperties = hast.properties;
    }
  };
  visit(tree, visitor);
};
