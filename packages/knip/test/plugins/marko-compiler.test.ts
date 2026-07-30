import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSync } from 'oxc-parser';
import { createCompiler } from '../../src/plugins/marko/compiler.ts';

test('Sanitize Marko while preserving module syntax for the parser', () => {
  const source = `<!--
import htmlComment from "html-comment"
-->
// import lineComment from "line-comment"
/* import blockComment from "block-comment" */
import defaultValue, { namedValue } from "./shared.ts"
server import { serverValue } from './server.ts'
client import type { ClientValue } from "./client.ts";
static import staticValue from "./static.ts";
import LocalTag from "./local-tag.marko"
import DiscoveredTag from "<discovered-tag>"
export { exportedValue } from "./exported.ts";
export type { ExportedType } from "./exported-type.ts";
<div title='import attributeValue from "attribute-value"'>
`;

  const output = createCompiler()(source, 'template.marko');

  assert.equal(
    output,
    `import "marko";



import defaultValue, { namedValue } from "./shared.ts"
import { serverValue } from './server.ts'
import type { ClientValue } from "./client.ts";
import staticValue from "./static.ts";
import LocalTag from "./local-tag.marko"

export { exportedValue } from "./exported.ts";
export type { ExportedType } from "./exported-type.ts";

`
  );
});

test('Preserve multiline imports and external re-exports verbatim', () => {
  const source = `import {
  formatPrice,
  formatWeight,
} from "./formatters.ts"
server import type {
  Product,
} from "./product.ts"
export {
  formatCurrency,
  formatQuantity,
}
  from "./formatters.ts"
export * as units
  from "./units.ts"
`;

  const output = createCompiler()(source, 'template.marko');

  assert.equal(
    output,
    `import "marko";
import {
  formatPrice,
  formatWeight,
} from "./formatters.ts"
import type {
  Product,
} from "./product.ts"
export {
  formatCurrency,
  formatQuantity,
}
  from "./formatters.ts"
export * as units
  from "./units.ts"
`
  );
  const result = parseSync('template.ts', output);
  assert.equal(result.module.staticExports.length, 2);
  assert.equal(result.module.dynamicImports.length, 0);
});

test('Neutralize Marko scripts and local exports', () => {
  const source = `$ const sharedValue = 1;
server const serverValue = 2;
client let clientValue = 3;
  static function getStaticValue() {}
export interface Input {
  value: string;
}
export type Result = string;
export const localValue = 4;
export async function loadValue() {}
export { sharedValue };
class {
  static create() {}

  async load() {
    return import("./lazy.ts");
  }
}
`;

  const output = createCompiler()(source, 'template.marko');

  assert.equal(
    output,
    `import "marko";
const sharedValue = 1;
const serverValue = 2;
let clientValue = 3;
  function getStaticValue() {}
interface Input {
  value: string;
}
type Result = string;
const localValue = 4;
async function loadValue() {}

class MarkoComponent {
  static create() {}

  async load() {
    return import("./lazy.ts");
  }
}
`
  );
  const result = parseSync('template.ts', output);
  assert.equal(result.module.staticExports.length, 0);
  assert.equal(result.module.dynamicImports.length, 1);
});

test('Put synthetic imports and compiled styles before trailing markup', () => {
  const source = `<style lang="scss">
@use "pkg:@scope/tokens";
</style>
<ebay-button title='import("attribute-value")'>
  Click me
</ebay-button>
broken concise markup
`;
  const compiler = createCompiler(new Map([['ebay-button', ['@ebay/ebayui-core']]]), ['legacy-taglib']);

  const output = compiler(source, 'template.marko');

  assert.equal(
    output,
    `import "marko";
import "legacy-taglib";
import "@ebay/ebayui-core";
import _$0 from '@scope/tokens';


  Click me

broken concise markup
`
  );
  const result = parseSync('template.ts', output);
  assert(result.errors.length > 0);
  assert.deepEqual(
    result.module.staticImports.map(item => item.moduleRequest.value),
    ['marko', 'legacy-taglib', '@ebay/ebayui-core', '@scope/tokens']
  );
});
