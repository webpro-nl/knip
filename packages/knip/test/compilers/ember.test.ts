import assert from 'node:assert/strict';
import test from 'node:test';
import { compiler } from '../../src/plugins/ember/compiler.ts';

test('Extract imports, re-exports and importSync calls from Ember template-tag files', () => {
  const source = `
    import Component from '@glimmer/component';
    import type { Signature } from './signature';
    import './setup';
    import { importSync } from '@embroider/macros';
    const load = () => import('./lazy');
    const sync = importSync('./sync');
    const member = macros.importSync('member-call');
    export { formatFruit } from './format-fruit';
    export * from './basket';
    export type { Fruit } from './types';
    export default class FruitCard extends Component<Signature> {
      <template>{{this.name}}</template>
    }
  `;
  assert.equal(
    compiler(source, 'fruit-card.gts'),
    [
      "import Component from '@glimmer/component'",
      "import type { Signature } from './signature'",
      "import './setup'",
      "import { importSync } from '@embroider/macros'",
      "import('./lazy')",
      "importSync('./sync')",
      "export { formatFruit } from './format-fruit'",
      "export * from './basket'",
      "export type { Fruit } from './types'",
    ].join(';\n')
  );
});

test('Template markers in comments and strings do not consume Ember imports', () => {
  const source = `
    // A <template> example: import Missing from 'line-comment';
    /* <template> import Missing from 'block-comment'; */
    const single = '<template> import Missing from "single-string"';
    const double = "<template> import Missing from 'double-string'";
    const literal = \`<template> import Missing from 'template-string'\`;
    const count = 1; // <template> import Missing from 'trailing-comment';
    // importSync('comment-only');
    const text = "importSync('string-only')";
    import FruitCard from './fruit-card';
    <template>
      <FruitCard />
      import Missing from 'template-text';
      {{! export * from 'template-comment'; }}
    </template>
    import { helper } from '@ember/helper';
  `;
  assert.equal(
    compiler(source, 'application.gjs'),
    "import FruitCard from './fruit-card';\nimport { helper } from '@ember/helper'"
  );
});
