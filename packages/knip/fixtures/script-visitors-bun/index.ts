import { $ } from 'bun';

await $`MY_VAR=${process.argv.at(2)} bun script.ts`;
