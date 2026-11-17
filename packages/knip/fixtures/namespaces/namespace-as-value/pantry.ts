import * as berries from './berries.ts';
import * as nuts from './nuts.ts';
import * as seeds from './seeds.ts';

export default function getBerries() {
  return berries;
}

export const crack = (nuts: number) => {
  return nuts;
};

let jar;
jar = seeds;
