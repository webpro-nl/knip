# Knip Playground (monorepo)

Welcome to this Knip playground. There are issues on purpose in this codebase
below so Knip will report various types of issues.

Feel free to (fork this project and) play around!

Run `npm run knip` on this codebase in the terminal below and Knip will report
the following issues:

```
$ npm run knip
Unused dependencies (1)
tinyglobby  package.json
Unlisted dependencies (1)
js-yaml  packages/shared/src/used-fn.ts
Unused exports (1)
unusedFunction  unknown  packages/shared/src/exports.ts:7:14
```

- `tinyglobby` is unused in the root `package.json`. It's listed and used in the
  `packages/shared` workspace, but not referenced elsewhere in the root
  workspace.
- `js-yaml` is used in `packages/shared/src/used-fn.ts`, but it's not listed as
  a dependency in `packages/shared/package.json`.
- `unusedFunction` is exported from `packages/shared/src/exports.ts` but it's
  not imported anywhere.
