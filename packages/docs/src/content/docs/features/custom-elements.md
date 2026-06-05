---
title: Custom Elements
---

Custom elements are registered under a tag name. When such a class isn't
referenced by name elsewhere, Knip would report the export as unused. Instead,
Knip recognizes the registration and considers the class used.

Native registration needs no configuration. Framework registrations are credited
through their plugin, which is enabled when the framework is a dependency.

## Native registration

The web standard `customElements.define()` credits the registered class:

```ts
export class MyCard extends HTMLElement {}

customElements.define('my-card', MyCard);
```

The `window`, `globalThis` and `self` prefixes are recognized too:

```ts
window.customElements.define('my-card', MyCard);
```

## Framework decorators

| Framework | Plugin    | `customElement` imported from                            |
| --------- | --------- | -------------------------------------------------------- |
| [Lit][1]  | [lit][2]  | `lit/decorators`, `lit-element`, `@lit/reactive-element` |
| [FAST][3] | [fast][4] | `@microsoft/fast-element`                                |

The decorator counts only when `customElement` is imported from the framework.
A locally defined `customElement`, or one imported from another module, is
ignored.

### Lit

A `@customElement('tag')` decorator credits the class when the matching plugin
is enabled:

```ts
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('my-card')
export class MyCard extends LitElement {}
```

## FAST

[FAST][3] also registers elements through a static `define()` or `defineAsync()`
method. A class extending `FASTElement`, directly or
through a mixin, is credited when registered this way:

```ts
import { FASTElement } from '@microsoft/fast-element';

export class MyCard extends FASTElement {}

MyCard.define('my-card');
```

[1]: https://lit.dev
[2]: ../reference/plugins/lit.md
[3]: https://fast.design
[4]: ../reference/plugins/fast.md
