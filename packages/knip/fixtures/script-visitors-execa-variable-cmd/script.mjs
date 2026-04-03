import { $ } from 'execa';

const command = 'npm';
await $`${command} publish --access=public --ignore-scripts`;
