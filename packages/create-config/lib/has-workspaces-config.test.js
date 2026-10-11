import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasWorkspacesConfig } from './has-workspaces-config.js';

test('matches the base case (LF, no trailing content)', () => {
  assert.equal(hasWorkspacesConfig('packages:\n  - packages/*\n'), true);
});

test('matches CRLF line endings', () => {
  assert.equal(hasWorkspacesConfig('packages:\r\n  - packages/*\r\n'), true);
});

test('matches trailing spaces after the colon', () => {
  assert.equal(hasWorkspacesConfig('packages:  \n  - packages/*\n'), true);
});

test('matches a comment after the colon', () => {
  assert.equal(hasWorkspacesConfig('packages: # comment\n  - packages/*\n'), true);
});

test('matches flow-style sequences', () => {
  assert.equal(hasWorkspacesConfig('packages: ["packages/*"]\n'), true);
});

test('matches a space before the colon', () => {
  assert.equal(hasWorkspacesConfig('packages :\n  - packages/*\n'), true);
});

test('does not match when packages is nested under another key', () => {
  assert.equal(hasWorkspacesConfig('catalog:\n  packages: 1.0.0\n'), false);
});

test('does not match an unrelated file', () => {
  assert.equal(hasWorkspacesConfig('onlyBuiltDependencies:\n  - esbuild\n'), false);
});
