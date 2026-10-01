// Consumes the spread namespace via named import
import { utilsAlias } from './ns-alias-reexport.js';

export function useUtils() {
  return utilsAlias;
}
