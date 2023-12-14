import * as NS from './barrel.ts';

type Key = keyof typeof NS;

const key = 'anything';

NS[key as Key].resolve();
