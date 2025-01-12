import { MyInterface } from './interfaces';
import { MyType } from './types';

// interface ExtendedInterface<T extends MyInterface> {
//   get: <K extends keyof T['keyA']>(key: K) => T['keyA'][K] | undefined;
// }

const i: MyInterface = {
  keyA: '',
  keyB: {
    subB: '',
  },
};

const t: MyType = {
  keyA: '',
  keyB: {
    subB: '',
  },
};

i;
t;
