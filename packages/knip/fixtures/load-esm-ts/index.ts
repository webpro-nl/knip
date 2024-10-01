// SyntaxError: Cannot use 'import.meta' outside a module

import.meta;
import.meta.resolve;
import.meta.url;

// SyntaxError: Unexpected identifier 'Promise'

Promise;

// TypeError: Reflect.metadata is not a function

function meow(target: unknown, _: unknown) {}

@meow
export class Cat {
  constructor() {}
}

// SyntaxError: await is only valid in async functions and the top level bodies of modules

await Promise.resolve('TLA');
