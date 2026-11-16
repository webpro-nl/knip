import assert from 'node:assert/strict';
import test from 'node:test';
import compiler from '../../src/plugins/astro/compiler.ts';

test('Local scripts in src attributes are imports', () => {
  const source = `<script type="application/ld+json" set:html={JSON.stringify(schema)}></script>
<!-- header -->
<script is:inline type="application/json" set:html={JSON.stringify(data)} />
<h1>Hey, I'm Max.</h1>
<script src="../scripts/local.js"></script>
<script
  src="./script-with-types.ts"
></script>
<!-- footer -->
<style>h1 { font-family: 'Lato', sans-serif; }</style>`;

  assert.equal(compiler(source, 'Page.astro'), "import '../scripts/local.js';\nimport './script-with-types.ts';");
});

test('Script src is not an import with other attributes, in comments, strings, scripts or frontmatter', () => {
  const source = `---
const html = '<script src="../scripts/string.ts"></script>';
// <script src="../scripts/line-comment.ts"></script>
---
<!-- <script src="../scripts/html-comment.ts"></script> -->
{/* <script src="../scripts/jsx-comment.ts"></script> */}
<Code code={\`<body>
  <script src="../scripts/template-literal.js"></script>
</body>\`} />
<Code code={'<script src="../scripts/single-quoted.js"></script>'} />
<Code code={"<script src='../scripts/double-quoted.js'></script>"} />
<script>const tag = '<script src="../scripts/in-string.ts">'; /* <script src="../scripts/in-comment.ts"> */</script>
<script is:inline src="../scripts/inline.js"></script>
<script src="../scripts/deferred.js" defer></script>
<script src="https://cdn.example.com/remote.js"></script>`;

  assert.equal(
    compiler(source, 'Page.astro'),
    `const html = '<script src="../scripts/string.ts"></script>';\n// <script src="../scripts/line-comment.ts"></script>\nconst tag = '<script src="../scripts/in-string.ts">'; /* <script src="../scripts/in-comment.ts"> */`
  );
});

test('Script src is not an import in template elements or elements with is:raw', () => {
  const source = `<template><script src="../scripts/template.ts"></script></template>
<pre is:raw><script src="../scripts/raw.ts"></script></pre>
<Fragment class="code" is:raw>
  <script src="../scripts/raw-fragment.ts"></script>
</Fragment>
<pre is:raw=""><script src="../scripts/raw-value.ts"></script></pre>
<div data-directive="is:raw"><script src="../scripts/attribute-value.ts"></script></div>
<script src="../scripts/local.ts"></script>`;

  assert.equal(
    compiler(source, 'Page.astro'),
    "import '../scripts/attribute-value.ts';\nimport '../scripts/local.ts';"
  );
});
