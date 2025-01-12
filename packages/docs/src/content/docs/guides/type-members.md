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

This is a highly experimental feature. Currently:

- There will be false positives.
- Only members of **exported** types and interfaces are considered
- Only members of **selected** types and interfaces are considered (see examples
  below)

:::

## Usage

Reporting unused type and interface members is disabled by default. To enable
this, make sure to include the `typeMembers` issue type:

```sh
knip --include typeMembers
```

Below are code examples to get an idea of what Knip should catch. Also see the
fixture folders ([1][1] & [2][2]) for slightly more involved examples.

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

## Closing Notes

- Only members of **exported** interfaces and types are considered.
- Knip tries to consider only **relevant** interfaces and types.
- Don't start exporting or reusing interfaces and types for the sake of Knip
  detecting unused properties.

Having said that, `ignoreExportsUsedInFile` can be enabled for types and
interfaces, and then unused members can be "un-ignored" (i.e. reported) like so:

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
