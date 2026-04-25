export type Fruit = {
  name: string;
  color: string;
};

export const pickFruit = (name: string): Fruit => ({ name, color: 'red' });

export const internalUnused = 1;

export type DraftFruit = { name: string };
