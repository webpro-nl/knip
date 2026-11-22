import { spawnSync } from 'node:child_process';

spawnSync('bun', ['run', 'build', '--watch']);
