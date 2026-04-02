import path from 'node:path';

const workerPath = path.join(__dirname, './indirect.js');

new Worker('./worker.js');
new WorkerThread(path.join(__dirname, './thread.js'));
fork('./forked.js');
cluster.fork(path.resolve(__dirname, './cluster.js'));
fork(workerPath);
