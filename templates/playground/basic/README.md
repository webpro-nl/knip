# Knip Playground (basic)

Welcome to this Knip playground. There are issues on purpose in this codebase
below so Knip will report various types of issues.

Feel free to (fork this project and) play around!

## Usage

```
npm run knip
```

## Issues

Run `npm run knip` on this codebase in the terminal below and Knip will report
the following issues:

```
❯ knip
Unused files (1)
clutter.ts
Unlisted dependencies (1)
unhead  lib.ts
Unused exports (1)
unusedFunction  unknown  lib.ts:6:14
```

- `clutter.ts` is an unused file, since it's not imported by any of the others
- `unhead` is an unlisted dependency, because it's used in `imported.ts`, but
  not listed in `package.json`
- `unusedFunction` is exported from `imported.ts` but it's not imported
  anywhere, so it's reported as an unused export.
