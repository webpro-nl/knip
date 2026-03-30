// NOT strictly NS: destructured from namespace
import * as Animals from './animals.js';

const { cat } = Animals;

export function useAnimal() {
  return cat;
}
