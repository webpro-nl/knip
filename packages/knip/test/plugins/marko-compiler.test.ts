import assert from 'node:assert/strict';
import test from 'node:test';
import compiler from '../../src/plugins/marko/compiler.ts';

test('Extract imports from Marko without parsing markup as JavaScript', () => {
  const source = `<!--
import htmlComment from "html-comment"
-->
// import lineComment from "line-comment"
/* import blockComment from "block-comment" */
import defaultValue, { namedValue } from "./shared.ts"
server import { serverValue } from './server.ts'
client import type { ClientValue } from "./client.ts";
import LocalTag from "./local-tag.marko"
import DiscoveredTag from "<discovered-tag>"
const lazyModule = import("./lazy.ts")
export { exportedValue } from "./exported.ts"
<div title='import attributeValue from "attribute-value"'>
`;

  assert.equal(
    compiler(source, 'template.marko'),
    `import "marko";
import defaultValue, { namedValue } from "./shared.ts";
import { serverValue } from './server.ts';
import type { ClientValue } from "./client.ts";
import LocalTag from "./local-tag.marko";
import("./lazy.ts");
export { exportedValue } from "./exported.ts";`
  );
});

test('Extract multiline imports and re-exports', () => {
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
} from "./formatters.ts"
export * as units
  from "./units.ts"
`;

  assert.equal(
    compiler(source, 'template.marko'),
    `import "marko";
import {
  formatPrice,
  formatWeight,
} from "./formatters.ts";
import type {
  Product,
} from "./product.ts";
export {
  formatCurrency,
  formatQuantity,
} from "./formatters.ts";
export * as units
  from "./units.ts";`
  );
});

test('Extract imports from concise style blocks', () => {
  const source = `<style lang="scss">
  @use "pkg:@scope/html";
</style>
style.scss {
  @use "pkg:@scope/braced";
}
style.scss
  --
    @use "pkg:@scope/tokens";
  --
style.less/styles
  --
    @import "@scope/theme";
  --
`;

  assert.equal(
    compiler(source, 'template.marko'),
    `import "marko";
import _$0 from '@scope/html';
import _$0 from '@scope/braced';
import _$0 from '@scope/tokens';
import _$0 from '@scope/theme';`
  );
});
