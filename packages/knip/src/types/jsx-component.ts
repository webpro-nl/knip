import type ts from 'typescript';
import type { Fix } from './exports.js';

type Identifier = string;

export type JSXComponentNode = {
  node: ts.Node;
  identifier: Identifier;
  propsPos: number;
  jsDocTags?: Set<string>;
  fix?: Fix;
};
