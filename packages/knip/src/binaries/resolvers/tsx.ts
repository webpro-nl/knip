import { toBinary } from '../../util/protocols.js';
import { resolve as resolveNode } from './node.js';
import type { Resolver } from '../types.js';

export const resolve: Resolver = (binary, args, options) => {
  args = args.map(a => (a === 'watch' ? '--watch' : a));
  return [toBinary(binary), ...resolveNode(binary, args, options)];
};
