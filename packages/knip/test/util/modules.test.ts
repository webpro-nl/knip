import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDefinitelyTypedFor, getPackageFromDefinitelyTyped, sanitizeSpecifier } from '../../src/util/modules.js';

test('Should return definitely typed package for package name', () => {
  assert.equal(getDefinitelyTypedFor('node'), '@types/node');
  assert.equal(getDefinitelyTypedFor('@npmcli/map-workspaces'), '@types/npmcli__map-workspaces');
  assert.equal(getDefinitelyTypedFor('@types/node'), '@types/node');
});

test('Should return package name from definitely typed package name', () => {
  assert.equal(getPackageFromDefinitelyTyped('node'), 'node');
  assert.equal(getPackageFromDefinitelyTyped('npmcli__map-workspaces'), '@npmcli/map-workspaces');
});

test('Should sanitize import specifier', () => {
  assert.equal(sanitizeSpecifier('specifier'), 'specifier');
  assert.equal(sanitizeSpecifier('/specifier'), '/specifier');
  assert.equal(sanitizeSpecifier('./specifier'), './specifier');
  assert.equal(sanitizeSpecifier('../specifier.ext'), '../specifier.ext');
  assert.equal(sanitizeSpecifier('specifier?query=1'), 'specifier');
  assert.equal(sanitizeSpecifier('specifier#hash'), 'specifier');
  assert.equal(sanitizeSpecifier('style-loader!css-loader?modules!./styles.css'), 'style-loader');
  assert.equal(sanitizeSpecifier('!!style-loader!css-loader?modules!./styles.css'), 'style-loader');
  assert.equal(sanitizeSpecifier('-!style-loader!css-loader?modules!./styles.css'), 'style-loader');
  assert.equal(sanitizeSpecifier('css-loader?modules!./styles.css'), 'css-loader');
  assert.equal(sanitizeSpecifier('./:id/specifier'), './:id/specifier');
  assert.equal(sanitizeSpecifier('#specifier'), '#specifier');
  assert.equal(sanitizeSpecifier('#id/specifier'), '#id/specifier');
  assert.equal(sanitizeSpecifier('~/id/specifier'), '~/id/specifier');
  assert.equal(sanitizeSpecifier('astro:content'), 'astro');
  assert.equal(sanitizeSpecifier('virtual:specifier'), 'virtual:specifier');
  assert.equal(sanitizeSpecifier('fs'), 'fs');
  assert.equal(sanitizeSpecifier('node:fs'), 'node:fs');
});
