import { collectImports } from './compilers.ts';

const dependencies = ['@tsrx/core', '@tsrx/react', '@tsrx/preact', '@tsrx/vue', '@tsrx/solid', '@tsrx/ripple'];

export default { dependencies, compiler: collectImports };
