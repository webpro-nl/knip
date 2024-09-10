# Knip Playground (basic)

Knip playground to show how Knip works. There are issues in this codebase on
purpose.

Feel free to fork this project and play around!

## Usage

```
npm run knip
```

## Issues

Running `knip` on this codebase will report the following issues:

```
❯ knip
Unlisted dependencies (1)
unhead  imported.ts
Unused exports (1)
unusedFunction  unknown  imported.ts:10:14
```

- `unhead` is an unlisted dependency, because it's used in `imported.ts`, but
  not listed in `package.json`
- `unused` is exported from `imported.ts` but it's not imported anywhere, so
  it's reported as an unused export.
