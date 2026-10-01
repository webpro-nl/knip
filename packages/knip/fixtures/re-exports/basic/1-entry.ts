import { something } from './2-re-export-star.js';
something;

export {
  /** @public */
  somethingToIgnore,
  somethingNotToIgnore,
} from './2-re-export-star.js';
