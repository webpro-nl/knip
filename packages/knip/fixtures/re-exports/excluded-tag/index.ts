import { something } from './module.js';
something;

/** @lintignore */
export { somethingToIgnore } from './module.js';

export { somethingUnused } from './module.js';

/** @lintignore */
export { apple as green } from './module.js';

export { default as Button } from './button.js';

/** @lintignore */
export default function App() {}
