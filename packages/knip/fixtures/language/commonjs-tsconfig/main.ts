const { fn1 } = require('./dir/module1');
const { fn2 } = require('./dir/module2.ts');
const { fn3 } = require('./dir/module3.js');

fn1;
fn2;
fn3;

const { destructuredBare } = require('./dir/wrapped');
const { destructuredAs } = require('./dir/wrapped') as typeof import('./dir/wrapped');
const { destructuredSatisfies } = require('./dir/wrapped') satisfies typeof import('./dir/wrapped');
const { destructuredParenthesized } = (require('./dir/wrapped'));
const { destructuredNonNull } = require('./dir/wrapped')!;
const { destructuredAssertion } = <typeof import('./dir/wrapped')>require('./dir/wrapped');
const { destructuredNested } = ((require('./dir/wrapped') as typeof import('./dir/wrapped'))!) satisfies typeof import('./dir/wrapped');

const memberBare = require('./dir/wrapped').memberBare;
const memberAs = (require('./dir/wrapped') as typeof import('./dir/wrapped')).memberAs;
const memberSatisfies = (require('./dir/wrapped') satisfies typeof import('./dir/wrapped')).memberSatisfies;
const memberParenthesized = (require('./dir/wrapped')).memberParenthesized;
const memberNonNull = require('./dir/wrapped')!.memberNonNull;
const memberAssertion = (<typeof import('./dir/wrapped')>require('./dir/wrapped')).memberAssertion;
const memberNested = (((require('./dir/wrapped') satisfies typeof import('./dir/wrapped'))!) as typeof import('./dir/wrapped')).memberNested;

console.log(
  destructuredBare,
  destructuredAs,
  destructuredSatisfies,
  destructuredParenthesized,
  destructuredNonNull,
  destructuredAssertion,
  destructuredNested,
  memberBare,
  memberAs,
  memberSatisfies,
  memberParenthesized,
  memberNonNull,
  memberAssertion,
  memberNested
);
