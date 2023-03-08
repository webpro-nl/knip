import is from '@sindresorhus/is';
import does from 'not-exist';
import has, { program } from './my-module.js';

const what = is(has);

const match = typeof program === 'function';

what;
match;
