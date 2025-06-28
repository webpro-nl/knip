import { $ } from 'bun';

await $`FOO=${process.argv.at(2)} bun script.ts`;
