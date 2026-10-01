import * as trees from './trees';
import { cedar } from './trees';
import * as fruits from './fruits';
import { apple } from './fruits';

const { oak, ...rest } = trees;
const { ...appleProps } = apple;
const { ...bananaProps } = fruits.banana;

const dynamicFruits = await import('./fruits.js');
const { ...dynamicBananaProps } = dynamicFruits.banana;

oak;
cedar;
rest;
appleProps;
bananaProps;
dynamicBananaProps;
