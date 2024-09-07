import type { Tree } from "./tree";

export enum Fruit {
  apple = "apple",
  orange = "orange",
}

export interface Farmer {
  plants: Tree[];
}
