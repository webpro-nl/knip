import { $, $sync } from 'execa';

/* global $ */
import { EOL } from 'node:os';
import { Octokit } from 'octokit';

await $`pnpm all-contributors generate`;

await $sync`npx -y all-contributors-cli@6.25 add user`;
