export const brew = () => 'brewed';

export type Leaf = { area: number };

function spread(leaf: Leaf) {
  return leaf.area;
}

spread({ area: 1 });
