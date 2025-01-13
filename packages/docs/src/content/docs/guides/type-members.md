---
title: Type & Interface Members
sidebar:
  label: Type Members
  order: 6
  badge:
    text: Experimental
    variant: caution
---

:::caution[Warning]

This is a highly experimental feature:

- It's slow.
- There will be false positives.
- Only members of **exported** types and interfaces are considered
- See the examples below to learn what type and interface members are considered

:::

## Usage

Reporting unused type and interface members is disabled by default. To enable
this, make sure to include the `typeMembers` issue type:

```sh
knip --include typeMembers
```

Below are code examples to get an idea of what Knip should catch. Also see the
fixture folders ([1][1] & [2][2]) for slightly more involved examples.

Use [JSDoc tags][3] to exclude individual members and [ignoreMembers][4] in the
Knip configuration file to exclude matching members from the report.

Add `--fix` if the results are good enough to [auto-remove the unused type
members][5].

## Interface Members

In the next example, `Dog.wings` is reported as unused:

```ts
export interface Dog {
  legs: number;
  wings: boolean;
}

const charlie: Dog = {
  legs: 4,
};
```

## Type Members

In the next example, `Pet.fins` and `Cat.horn` are reported as unused:

```ts
export type Pet = {
  legs: number;
  fins: boolean;
};

export type Cat = {
  legs: Pet['legs'];
  horn: boolean;
};

const coco: Cat = {
  legs: 4,
};
```

## Function Arguments

In the next example, `Args.caseB` is reported as unused:

```ts
export interface Args {
  caseA: boolean;
  caseB: boolean;
}

function fn(options: Args) {
  if (options.caseA) return 1;
}

fn({ caseA: true });
```

## JSX Component Props

Component props that are not referenced, are reported as unused.

Note that props that are referenced inside the component, but never passed in as
part of the JSX props or argument(s), are not reported.

### Example 1: Passed prop

In the next example `unusedProp` is reported as unused:

```tsx
export interface ComponentProps {
  usedProp: boolean;
  unusedProp: boolean;
}

const Component: React.FC<ComponentProps> = props => null;

const App = () => (
  <>
    <Component usedProp={true} />;
    <Component {...{ usedProp: true }} />
    { React.createElement(Component, { usedProp: true }); }
  </>
);
```

### Example 2: Used prop

In the next example `deep.unusedProp` is reported as unused:

```tsx
export type ComponentProps = {
  usedProp: boolean;
  deep: {
    unusedProp: boolean;
  };
};

const Component: React.FC<ComponentProps> = props => (
  <span>{props.usedProp}</span>
);

const App = () => <Component />;
```

## Rationale

One of Knip's main goals is to find **unused exports**, not unused members. It's
built around a module and dependency graph to link up imports and exports.

Finding and [fixing enum][6] and [class members][7] is already supported, but
these features are limited to those on exported enums and classes. From the
perspective of "find unused members" alone this is perhaps an odd limitation. So
why even support this? It's just that Knip happens to be in a great position to
extend its reach from exports to also find and fix unused members on those
exports. There's value in a tool that finds and fixes unused members of classes,
enums, types and interfaces in an automated fashion. The question is: does the
value outweigh the cost of the scope creep? Perhaps, and as it stands today only
if the scope is kept within the boundaries of exported values and types (and
does not descend into trying to find and fix "everything"). In any case, it's
exciting to explore this area. Let's see how it goes!

## `ignoreExportsUsedInFile`

Only members of **exported** interfaces and types are considered. Don't start
exporting or reusing interfaces and types for the sake of Knip detecting unused
members.

Having said that, [ignoreExportsUsedInFile][8] can be enabled for exported types
and interfaces that aren't imported anywhere, and then unused members can be
"un-ignored" (i.e. reported) like so:

```json
{
  "include": ["typeMembers"],
  "ignoreExportsUsedInFile": {
    "type": true,
    "interface": true,
    "member": false
  }
}
```

[1]:
  https://github.com/webpro-nl/knip/tree/feat/unused-exported-type-members/packages/knip/fixtures/type-members
[2]:
  https://github.com/webpro-nl/knip/tree/feat/unused-exported-type-members/packages/knip/fixtures/type-members2
[3]: ../reference/jsdoc-tsdoc-tags.md
[4]: ../reference/configuration.md#ignoremembers
[5]: ../features/auto-fix.mdx#type-members-
[6]: ../features/auto-fix.mdx#enum-members
[7]: ../features/auto-fix.mdx#class-members-
[8]: ../reference/configuration.md#ignoreExportsUsedInFile
