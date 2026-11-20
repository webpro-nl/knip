import basket from './basket.ts';
import getBerries, { crack } from './pantry.ts';

console.log(basket.fruits.apple, basket.carrot, getBerries().cherry, crack(1));
