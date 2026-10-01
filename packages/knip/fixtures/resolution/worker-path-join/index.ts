import * as childProcess from 'node:child_process';
import { fork, spawn } from 'node:child_process';
import path, { join, resolve, join as j } from 'node:path';
import { Worker, Worker as WT } from 'node:worker_threads';

new Worker(path.join(__dirname, 'workers', 'compute.js'));
new Worker(path.resolve(__dirname, './workers/render.js'));

new Worker(join(__dirname, 'workers/destructured-join.js'));
fork(resolve(__dirname, 'scripts/destructured-resolve.js'));

fork(path.join(__dirname, 'scripts/typecheck.js'));
spawn(path.join(__dirname, 'scripts/lint.js'));
childProcess.execFile(path.resolve(__dirname, './scripts/format.js'));

// Unsupported:

const bound = path.join(__dirname, 'workers/bound.js');
new Worker(bound);

fork('./scripts/bare.js');

const otherDir = '/tmp';
new Worker(path.join(otherDir, 'workers/not-dirname.js'));

const dynamicName = 'dynamic.js';
new Worker(path.join(__dirname, 'workers', dynamicName));

new WT(path.join(__dirname, 'workers/aliased-worker-class.js'));

fork(j(__dirname, 'scripts/aliased-path-helper.js'));
