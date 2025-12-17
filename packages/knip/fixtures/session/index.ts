export * from './a';
export * from './b';
export * from './c';
export * from './rose.ts';

import { OVERLOAD } from './overload-1.ts';
OVERLOAD;

import { DIAMOND } from './diamond-top.ts';
DIAMOND;

import defaultValue from './default-export.ts';
defaultValue;

import './runner.ts';
