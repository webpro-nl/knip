import * as Lib from '@fixtures/e2e-lib-namespace-subpaths';
import { greet, type Greeting } from '@fixtures/e2e-lib-namespace-subpaths/utils';

const a: Greeting = greet('world');
const b: Lib.Greeting = Lib.Utils.greet('hello');
a;
b;
