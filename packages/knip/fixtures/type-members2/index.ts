import { MyInterface } from './interfaces';
import { MyType } from './types';

// interface ExtendedInterface<T extends MyInterface> {
//   get: <K extends keyof T['keyA']>(key: K) => T['keyA'][K] | undefined;
// }

const i: MyInterface = {
  keyA: '',
  keyB: {
    // subA: 'Knip also finds unused non-optional members, but the compiler catches those too',
    subB: '',
  },
};

const t: MyType = {
  keyA: '',
  keyB: {
    // subA: 'Knip also finds unused non-optional members, but the compiler catches those too',
    subB: '',
  },
};

i;
t;
