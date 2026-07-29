interface Array<T> {
  toReversed(): T[];
  toSorted(compareFn?: (a: T, b: T) => number): T[];
}

interface ReadonlyArray<T> {
  toReversed(): T[];
  toSorted(compareFn?: (a: T, b: T) => number): T[];
}
