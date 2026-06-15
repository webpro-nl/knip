---
title: Custom Elements
description: How Knip credits custom element classes registered via `customElements.define()` or Lit, FAST, Stencil and Catalyst decorators.
---

Custom elements are registered under a tag name. When such a class isn't
referenced elsewhere, Knip would report the export as unused. Instead, Knip
recognizes the registration and considers the class used.

Native registration needs no configuration. Framework registrations are credited
through their plugin, which is enabled when the framework is a dependency.

## Native registration

The web standard `customElements.define()` credits the registered class:

```ts
export class MyCard extends HTMLElement {}

customElements.define('my-card', MyCard);
```

The registry can be the global `customElements` — directly, through a `window`,
`globalThis` or `self` prefix, or a local alias — a `CustomElementRegistry`
instance, or a shadow root's scoped registry:

```ts
const registry = new CustomElementRegistry();
registry.define('my-card', MyCard);
```

A class can also register itself from a `static` block using `this`:

```ts
export class MyCard extends HTMLElement {
  static {
    customElements.define('my-card', this);
  }
}
```

## Framework registration

| Framework     | Plugin        | Registration                    | Imported from                                            |
| ------------- | ------------- | ------------------------------- | -------------------------------------------------------- |
| [Lit][1]      | [lit][2]      | `@customElement('tag')`         | `lit/decorators`, `lit-element`, `@lit/reactive-element` |
| [FAST][3]     | [fast][4]     | `@customElement` or `.define()` | `@microsoft/fast-element`                                |
| [Stencil][5]  | [stencil][6]  | `@Component({ tag })`           | `@stencil/core`                                          |
| [Catalyst][7] | [catalyst][8] | `@controller`                   | `@github/catalyst`                                       |

The decorator counts only when imported from the framework. A locally defined or
differently-imported decorator is ignored.

### Lit

A `@customElement('tag')` decorator credits the class when the matching plugin
is enabled:

```ts
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('my-card')
export class MyCard extends LitElement {}
```

### FAST

[FAST][3] also registers elements through a static `define()` or `defineAsync()`
method. A class extending `FASTElement`, directly or through a mixin, is
credited when registered this way:

```ts
import { FASTElement } from '@microsoft/fast-element';

export class MyCard extends FASTElement {}

MyCard.define('my-card');
```

### Stencil

A `@Component` decorator credits the class:

```ts
import { Component } from '@stencil/core';

@Component({ tag: 'my-card' })
export class MyCard {}
```

### Catalyst

The bare `@controller` decorator registers the element under a tag derived from
the class name:

```ts
import { controller } from '@github/catalyst';

@controller
export class MyCardElement extends HTMLElement {}
```

[1]: https://lit.dev
[2]: ../reference/plugins/lit.md
[3]: https://fast.design
[4]: ../reference/plugins/fast.md
[5]: https://stenciljs.com
[6]: ../reference/plugins/stencil.md
[7]: https://catalyst.rocks
[8]: ../reference/plugins/catalyst.md
