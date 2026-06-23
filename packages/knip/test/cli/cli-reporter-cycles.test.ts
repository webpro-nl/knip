import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/circular-dependencies');

test('knip --cycles --reporter cycles (tree output)', () => {
  const { stdout, stderr, status } = exec('knip --cycles --reporter cycles', { cwd });
  assert.equal(stderr, '');
  assert.match(stdout, /Circular dependencies \(4\)/);
  assert.match(stdout, /^apricot\.ts:1:10$/m);
  assert.match(stdout, /└── import \.\/banana → banana\.ts:1:10$/m);
  assert.match(stdout, /└── import \.\/apricot → apricot\.ts:1:10 ↩$/m);
  assert.match(stdout, /^citrus\.ts:1:10 \(2 cycles\)$/m);
  assert.match(
    stdout,
    /└── import \.\/lemon → lemon\.ts:1:10\n    └── import \.\/lime → lime\.ts:1:10\n        └── import \.\/citrus → citrus\.ts:1:10 ↩/m
  );
  assert.match(
    stdout,
    /└── import \.\/lemon → lemon\.ts:2:10\n    └── import \.\/orange → orange\.ts:1:10\n        └── import \.\/citrus → citrus\.ts:1:10 ↩/m
  );
  assert.match(stdout, /^ping\.ts:1:10$/m);
  assert.match(stdout, /└── import \.\/pong → pong\.ts:1:10$/m);
  assert.match(stdout, /└── import \.\/ping → ping\.ts:1:10 ↩$/m);
  assert.doesNotMatch(stdout, /zucchini\.ts/);
  assert.ok(stdout.indexOf('apricot.ts') < stdout.indexOf('ping.ts'));
  assert.ok(stdout.indexOf('citrus.ts') < stdout.indexOf('ping.ts'));
  assert.equal(status, 0);
});
