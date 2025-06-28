---
title: Working with CommonJS
---

CommonJS is the JavaScript module system using `require()` and `module.exports`
statements.

Knip works well with CommonJS. You don't need to use ES Modules or a
`tsconfig.json` to use Knip.

The dynamic nature of CommonJS leaves room for ambiguity: it's sometimes unclear
whether an export is a default or a named export (and thus how it should be
imported). So we'll have to agree on a few conventions to prevent false
positives. Those conventions are designed to minimize impact on existing
codebases, improve consistency, and ease migration to ES Modules or TypeScript.

For **named exports**, the recommendation is to assign keys to `module.exports`:

```js
const B = function () {};

module.exports.A = { option: true };
module.exports.B = B;
```

Alternatively, assign an object with ONLY shorthand property assignments to
`module.exports`:

```js
const A = function () {};
const B = { option: true };

module.exports = { A, B };
```

Anything else assigned to `module.exports` is considered a default export, and
should be imported as such.

The following **default import** of the **named exports** above will result in
all those exports reported as unused, even when referenced like below:

```js
const DefaultImport = require('./common.js');
const runtime = [DefaultImport.A, DefaultImport.B];
```

Instead, do this:

```js
const { A, B } = require('./common.js');
const runtime = [A, B];
```

Not recommended per se, but the following import syntax also results in the
named export `A` being used:

```js
const runtime = [require('./common.js').A];
```

Add a non-shorthand property to turn the named object notation into a single
**default export**:

```js
const A = function () {};
const B = { option: true };

module.exports = { __esModule: true, A, B };
```

The `__esModule` key could be named differently (but makes sense given it's an
informal "CJS/ESM interop" standard amongst compilers and bundlers).
