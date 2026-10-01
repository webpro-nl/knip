import * as Lib from '@fixtures/e2e-lib-export-star-as';
import { greet, type Greeting } from '@fixtures/e2e-lib-export-star-as/utils';

const a: Greeting = greet('world');
const b: Lib.Greeting = Lib.Utils.greet('hello');
a;
b;
