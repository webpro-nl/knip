import * as NS from './intermediate';

Object.getOwnPropertyNames(NS);
// Uncommenting any of the following with result in all the others being unused (or w/ --include nsExports)
// NS.notReexported.banana;
// NS.namedReexported.coconut;
// NS.defaultReexported.pineapple;
