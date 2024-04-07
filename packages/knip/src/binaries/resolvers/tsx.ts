import { toBinary } from '../../util/protocols.js';
import type { Resolver } from '../types.js';
import { resolve as resolveNode } from './node.js';

export const resolve: Resolver = (binary, args, options) => {
  args = args.map(a => (a === 'watch' ? '--watch' : a));
  return [toBinary(binary), ...resolveNode(binary, args, options)];
};
