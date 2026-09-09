import { CrossNamespace, Entity, foo, type Model } from './barrel';
import copied from './default-fruits';
import copiedAgain from './default-vegetables';
import './default-barrel';
import { same } from './copy-barrel';
import { converged, expressionDefault, namedDefault, split } from './alias-barrel';
import { Produce } from './namespace-barrel';
import { Produce as DistinctProduce } from './namespace-distinct-barrel';
import { fruit as FruitNamespace } from './namespace-explicit-barrel';
import { fruit as winner } from './explicit-barrel';
import { cycleName } from './cycle-a';
import type { TypeEntity } from './type-barrel';

foo();
const model: Model = { name: 'apple' };
console.log(model);
new Entity();
console.log({} as TypeEntity);
console.log(
  CrossNamespace,
  copied,
  copiedAgain,
  same,
  converged,
  split,
  namedDefault,
  expressionDefault,
  Produce,
  DistinctProduce.vegetable,
  FruitNamespace,
  winner,
  cycleName
);
