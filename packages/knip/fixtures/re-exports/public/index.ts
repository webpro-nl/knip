import { something } from './module.js';
something;

/** @public */
export {
  /** @public */
  somethingToIgnore,
  somethingIgnoredAnyway,
} from './module.js';

/** @public */
export { apple as green } from './module.js';

export { default as Button } from './button.js';

/** @public */
export default function App() {}
