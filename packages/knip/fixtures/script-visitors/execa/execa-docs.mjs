import { $ } from 'execa';

await $`cat package.json | grep name`;

let branch = await $`git branch --show-current`;
await $`dep deploy --branch=${branch}`;

await Promise.all([$`executable1; echo 1`, $`executable2; echo 2`, $`executable3; echo 3`]);

let name = 'foo bar';
await $`mkdir /tmp/${name}`;
