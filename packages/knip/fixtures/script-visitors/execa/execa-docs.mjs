import { $ } from 'execa';

await $`cat package.json | grep name`;

const branch = await $`git branch --show-current`;
await $`dep deploy --branch=${branch}`;

await Promise.all([$`executable1; echo 1`, $`executable2; echo 2`, $`executable3; echo 3`]);

const name = 'foo bar';
await $`mkdir /tmp/${name}`;
