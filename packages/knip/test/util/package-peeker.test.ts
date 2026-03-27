import assert from 'node:assert/strict';
import test from 'node:test';
import { PackagePeeker } from '../../src/PackagePeeker.ts';

test('Find dependency location in YAML manifest', () => {
  const manifestStr = [
    'name: demo',
    'dependencies:',
    '  alpha: 1.0.0',
    'devDependencies:',
    '  beta: 1.0.0',
    'optionalPeerDependencies:',
    '  gamma: 1.0.0',
  ].join('\n');

  const peeker = new PackagePeeker(manifestStr);
  const dep = peeker.getLocation('dependencies', 'alpha');
  const dev = peeker.getLocation('devDependencies', 'beta');
  const opt = peeker.getLocation('optionalPeerDependencies', 'gamma');

  assert(dep);
  assert.equal(dep.line, 3);
  assert(dev);
  assert.equal(dev.line, 5);
  assert(opt);
  assert.equal(opt.line, 7);
});

test('Escape regex characters in YAML package names', () => {
  const manifestStr = ['name: demo', 'dependencies:', '  aXb: 1.0.0', '  a.b: 2.0.0'].join('\n');

  const peeker = new PackagePeeker(manifestStr);
  const location = peeker.getLocation('dependencies', 'a.b');

  assert(location);
  assert.equal(location.line, 4);
});
