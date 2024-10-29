import * as bun from './bun.js';
import * as npm from './npm.js';
import * as npx from './npx.js';
import * as pnpm from './pnpm.js';
import * as yarn from './yarn.js';

export default {
  bun: bun.resolve,
  npm: npm.resolve,
  npx: npx.resolve,
  pnpm: pnpm.resolve,
  yarn: yarn.resolve,
};
