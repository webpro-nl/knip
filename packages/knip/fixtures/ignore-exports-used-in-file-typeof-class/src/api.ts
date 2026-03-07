export function logger(): void {}

export function setLogger(fn: typeof logger): void {
  void fn;
}

export class TreeNode {
  children: TreeNode[] = [];
}

export class TreeLeaf {
  value = '';
}

export function createTree(): TreeNode {
  const node = new TreeNode();
  node.children.push(new TreeLeaf() as unknown as TreeNode);
  return node;
}

export class Leaf {
  text = '';
}

export interface Collection {
  isLeaf(): this is Leaf;
}

export class Node {
  value = 0;
}

export interface Walker {
  visit(n: Node): void;
}

function internal(w: Walker) {
  w.visit(new Node());
}

internal({ visit: () => {} });
