import { h } from 'hastscript';
import type { Node, Parent } from 'unist';
import { type Visitor, visit } from 'unist-util-visit';

interface DirectiveNode extends Node {
  type: 'textDirective' | 'leafDirective' | 'containerDirective';
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: ignore
  attributes: Record<string, any>;
  // biome-ignore lint/suspicious/noExplicitAny: ignore
  data: Record<string, any>;
}

const isDirectiveNode = (node: Node): node is DirectiveNode =>
  node.type === 'textDirective' || node.type === 'leafDirective' || node.type === 'containerDirective';

export const transformDirectives = () => (tree: Parent) => {
  const visitor: Visitor<Node> = node => {
    if (isDirectiveNode(node)) {
      const hast = h(node.name, node.attributes);
      // biome-ignore lint/suspicious/noAssignInExpressions: ignore
      const data = node.data || (node.data = {});
      data.hName = hast.tagName;
      data.hProperties = hast.properties;
    }
  };
  visit(tree, visitor);
};
