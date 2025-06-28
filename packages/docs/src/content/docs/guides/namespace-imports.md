---
title: Namespace Imports
---

The intention of exports used through namespace imports may not always be clear
to Knip. Here's a guide to better understand how Knip handles such exports.

## Example

We start off by having two exports:

```ts title="my-namespace.js"
export const version = 'v5';
export const getRocket = () => '🚀';
```

The next snippet shows how to import all the exports above on a namespace. All
exports of the `my-namespace.js` module will be members on the `NS` object:

```ts title="my-module.ts"
import * as NS from './my-namespace.js';
import send from 'stats';
send(NS);
```

The intention of export usage is not always clear. In the example above is
`version` or `getRocket` used? We're not sure, but we _probably_ don't want them
to be reported as unused. The same goes for the next example:

```ts title="my-module.ts"
import * as NS from './my-namespace.js';

export { NS };
```

If this all usage of the `NS` namespace object, we also don't know whether
individual exports like `version` or `getRocket` will be used. However, if at
least one reference to a property such as `NS.version` is found, then the
individual exports are considered separately again and `getRocket` will be
marked as unused:

```ts title="index.ts"
import { NS } from './my-module.js';

const version = NS.version;
```

## The default heuristic

Knip uses the following heuristic to determine which of the individual exports
are used:

- If there's one or more references to the import namespace object, but without
  any property access, all exports on that namespace are considered used.
- Otherwise, exports are considered separately.

Below are a few more examples, and a way to disable this default behavior.

## Examples

Let's take a look at more examples:

```ts title="my-namespace.ts"
export const start = 1;

export const end = 1;
```

In the following cases all exports of `my-namespace.ts` are considered used:

```ts title="index.ts"
import * as NS from './my-namespace.js';
import send from 'stats';

send(NS);

const spread = { ...NS };

const shorthand = { NS };

const assignment = NS;

const item = [NS];

type TypeOf = typeof NS;

Object.values(NS);

for (const fruit in Fruits) {
  //
}

export { NS };

export { NS as AliasedNS };

export = NS;
```

However, this is no longer the case when one of the properties is accessed:

```ts title="index.js"
import * as NS from './namespace.js';

const begin = NS.start;

send(NS);
```

In this case, the `end` export will be reported as unused, even though the `NS`
object itself is referenced on its own as well.

## Include `nsExports` and `nsTypes`

To disable the heuristic as explained above, and enforce Knip to consider each
export on a namespace individually, include the `nsExports` issue type:

```json
{
  "include": ["nsExports"]
}
```

Or use the `--include nsExports` argument from the CLI. The `nsTypes` can be
added as well to do the same for exported types.
