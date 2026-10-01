import cp, { exec, execFile, execFileSync, execSync, fork, spawn, spawnSync } from 'node:child_process';
import * as childProcess from 'node:child_process';
import { execSync as runSync } from 'node:child_process';
import path from 'node:path';

// exec/execSync: the first argument is a shell command string
exec('mango --ripe');
execSync('papaya');
execSync('kumquat && mandarin');

// spawn/execFile and their Sync variants: executable + literal args array
execFile('lychee', ['--peel']);
execFileSync('guava');
spawn('durian', ['--spike', 'on']);
spawnSync('rambutan');

// namespace, default and aliased imports
childProcess.exec('passionfruit');
cp.execSync('dragonfruit');
childProcess.spawn('jackfruit', ['--big']);
runSync('starfruit');

// inline path.join(__dirname, ...) stays an entry file
spawn(path.join(__dirname, 'scripts', 'worker.js'));
fork(path.join(__dirname, 'scripts', 'task.js'));

// options objects and callbacks must never be parsed as inputs
execSync('lemon', { cwd: '/tmp', encoding: 'utf8' });
exec('lime', (_error, stdout) => stdout);
spawn('coconut', { stdio: 'inherit' });
spawn('peach', [], { cwd: '/tmp' });
execFile('plum', ['--cache'], { cwd: '/tmp' });
execFileSync('apricot', undefined, { cwd: '/tmp' });

// shell metacharacters inside literal args must not create phantom binaries
execFile('cherry', ['commit', '-m', 'ship it && phantomdeploy']);
spawn('grape', ['render', 'a | phantomgrep']);

const target = 'prod';
execSync(`fig deploy --target=${target}`);
exec(`melon ${target} --watch`);
const bin = 'watermelon';
execSync(`${bin} phantomserve`);

// not referenced: dynamic command, and a non-child_process `.exec`
const dynamic = 'kiwi';
execSync(dynamic);
const re = /apple/;
re.exec('banana');
