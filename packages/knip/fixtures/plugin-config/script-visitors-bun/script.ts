import { $ } from 'bun';

await $`cd .. && rm -rf node_modules/rimraf`;

await $`bun boxen I ❤ unicorns`;

await $`oh-my not supported yet`;

await $`ls *.*`;

const directoryPath = '/tmp/repo';
await $`git -C ${directoryPath} config fetch.prune false`;
