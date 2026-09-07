import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compilers/errors');

for (const config of ['sync-throw', 'promise-reject', 'async-reject']) {
  test(`Report one contextual compiler error for ${config}`, () => {
    const { stdout, stderr, status } = exec(`knip --config ${config}.ts`, { cwd });

    assert.equal(status, 2);
    assert.equal(stdout, '');
    assert.equal(stderr.match(/Compiler for \.foo/g)?.length, 1);
    assert.match(stderr, /Compiler for \.foo failed.*module\.foo/);
    assert.match(stderr, /Reason: compiler failed/);
    assert.doesNotMatch(stderr, /unhandled|\n\s+at /i);
  });
}

for (const config of ['invalid-sync', 'invalid-promise']) {
  test(`Report one contextual configuration error for ${config}`, () => {
    const { stderr, status } = exec(`knip --config ${config}.ts`, { cwd });

    assert.equal(status, 2);
    assert.equal(stderr.match(/Compiler for \.foo/g)?.length, 1);
    assert.match(stderr, /Compiler for \.foo returned number.*module\.foo/);
    assert.match(stderr, /expected a string or PromiseLike<string>/);
    assert.doesNotMatch(stderr, /unhandled|\n\s+at |async keyword/i);
  });
}
