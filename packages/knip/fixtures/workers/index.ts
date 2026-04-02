import { fork } from 'node:child_process';

new Worker('./worker.js');
new WorkerThread('./worker-thread.js');
fork('./forked.js');
