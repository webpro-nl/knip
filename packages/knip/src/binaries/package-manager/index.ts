import * as bun from './bun.ts';
import * as bunx from './bunx.ts';
import * as npm from './npm.ts';
import * as npx from './npx.ts';
import * as pnpm from './pnpm.ts';
import * as pnpx from './pnpx.ts';
import * as yarn from './yarn.ts';

export default {
  bun: bun.resolve,
  bunx: bunx.resolve,
  npm: npm.resolve,
  npx: npx.resolve,
  pnpm: pnpm.resolve,
  pnpx: pnpx.resolve,
  yarn: yarn.resolve,
};
