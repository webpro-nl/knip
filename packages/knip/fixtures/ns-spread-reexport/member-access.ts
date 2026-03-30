// NOT strictly NS: direct member access (NS.member)
import * as Fruits from './fruits.js';

export function useFruit() {
  return Fruits.apple;
}
