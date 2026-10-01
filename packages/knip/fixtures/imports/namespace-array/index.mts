import * as a from './a.mts';
import * as b from './b.mts';

const item = [a];
const commands = new Map([
  ['a', a],
  ['b', b],
]);

await commands.get(process.argv[2])?.run();
void item;
