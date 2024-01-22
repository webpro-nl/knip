import * as bun from './bun.js';
import * as c8 from './c8.js';
import * as dotenv from './dotenv.js';
import * as node from './node.js';
import * as nodemon from './nodemon.js';
import * as npx from './npx.js';
import * as nx from './nx.js';
import * as pnpm from './pnpm.js';
import * as rollup from './rollup.js';
import * as tsNode from './ts-node.js';
import * as tsx from './tsx.js';
import * as yarn from './yarn.js';

export default {
  bun: bun.resolve,
  c8: c8.resolve,
  dotenv: dotenv.resolve,
  node: node.resolve,
  nodemon: nodemon.resolve,
  npx: npx.resolve,
  nx: nx.resolve,
  pnpm: pnpm.resolve,
  rollup: rollup.resolve,
  'ts-node': tsNode.resolve,
  tsx: tsx.resolve,
  yarn: yarn.resolve,
};
