import assert from 'node:assert/strict';
import test from 'node:test';
import compiler from '../../src/plugins/tailwind/compiler.ts';

test('Compile Tailwind CSS URL imports', () => {
  const css = `@import url("./double-quoted.css");
@import url('../single-quoted.css');
@import url(./unquoted.css);
@import "./quoted-import.css";
@config "./tailwind.config.ts";
@plugin "./tailwind-plugin.ts";
@import url("https://cdn.example.com/external.css");
@import url('data:text/css,body{}');
@import url(//cdn.example.com/protocol-relative.css);
/* @import url("./commented.css"); */
.single-string { content: '@import url("./single-string.css");'; }
.double-string { content: "@import url('./double-string.css');"; }`;

  assert.equal(
    compiler(css),
    `import _$0 from './double-quoted.css';
import _$1 from '../single-quoted.css';
import _$2 from './unquoted.css';
import _$3 from './quoted-import.css';
import _$4 from './tailwind.config.ts';
import _$5 from './tailwind-plugin.ts';`
  );
});
