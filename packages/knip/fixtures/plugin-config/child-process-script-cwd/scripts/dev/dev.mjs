import { spawnSync } from 'node:child_process';

spawnSync('bun', ['run', 'build', '--workspace', 'app']);
spawnSync('yarn', ['--cwd', '../../packages/app', 'run', 'build', '--watch']);
