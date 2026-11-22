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

test('Compile CSS url() package in @font-face', () => {
  const css = `@font-face {
  font-family: 'Archivo Variable';
  src: url("@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2") format('woff2-variations');
}`;

  assert.equal(compiler(css), `import _$0 from '@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2';`);
});

test('Compile static local CSS URLs', () => {
  const css = `@import url("./imported.css");
@font-face {
  src: url("./fonts/icons.eot?v=1#iefix") format("embedded-opentype"), url('./fonts/icons.woff2') format("woff2");
}
.spaced { background: url( "../images/spaced.png" ); }
.quote { background: url("it's.png"); }
.fragment { fill: url(#gradient); }
.root { background: url("/logo.svg"); }
.data { background: url("data:image/svg+xml,<svg></svg>"); }
.external { background: url(https://cdn.example.com/external.png); }
.protocol-relative { background: url(//cdn.example.com/protocol-relative.png); }
.variable { background: url(var(--background)); }
/* .comment { background: url("./commented.png"); } */
.string { content: 'url("./string.png")'; }`;

  assert.equal(
    compiler(css),
    `import _$0 from './imported.css';
import _$1 from './fonts/icons.eot';
import _$2 from './fonts/icons.woff2';
import _$3 from '../images/spaced.png';`
  );
});

test('Compile Tailwind CSS @plugin options blocks', () => {
  const css = `@import "tailwindcss" source("./{app,ui}");
@plugin "@tailwindcss/forms" { strategy: "class" }
@plugin "@tailwindcss/typography" {
  className: wysiwyg
}
@import "./base.css" /* { url(./ghost.svg) } */;
@plugin "./tailwind-plugin.ts" {}`;

  assert.equal(
    compiler(css),
    `import _$0 from 'tailwindcss';
import _$1 from '@tailwindcss/forms';
import _$2 from '@tailwindcss/typography';
import _$3 from './base.css';
import _$4 from './tailwind-plugin.ts';`
  );
});
