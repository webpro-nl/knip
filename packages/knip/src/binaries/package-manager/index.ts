import * as bun from './bun.js';
import * as bunx from './bunx.js';
import * as npm from './npm.js';
import * as npx from './npx.js';
import * as pnpm from './pnpm.js';
import * as pnpx from './pnpx.js';
import * as yarn from './yarn.js';

export default {
  bun: bun.resolve,
  bunx: bunx.resolve,
  npm: npm.resolve,
  npx: npx.resolve,
  pnpm: pnpm.resolve,
  pnpx: pnpx.resolve,
  yarn: yarn.resolve,
};
