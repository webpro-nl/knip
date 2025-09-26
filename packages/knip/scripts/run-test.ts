#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const bun = spawnSync('bun', ['--version'], { stdio: 'ignore' });
const command = !bun.error && bun.status === 0 ? 'test:bun' : 'test:node';
const result = spawnSync('pnpm', ['run', command, ...args], { stdio: 'inherit' });

process.exit(result.status ?? 1);
