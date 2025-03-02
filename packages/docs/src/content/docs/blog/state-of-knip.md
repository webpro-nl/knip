---
title: The State of Knip
date: 2025-02-28
sidebar:
  order: 1
---

_Published: 2025-02-28_

Honestly, Knip was a bit of a "cursed" project from the get-go. Getting anywhere
near a level of being broadly-ish valuable requires a good amount of
~~foolishness~~ determination, and it has always been clear it would stay far
from perfect. It's telling that most of [similar projects][1] have been
abandoned.

And even though Knip is in its infancy, this update is meant as a sign we feel
we're still on to something. External indicators include increased usage looking
at numbers such as dependent repositories on GitHub and weekly downloads on npm,
and bug reports about increasingly less rudimentary issues.

## Two Cases

For those interested, let's take a look at two cases that hopefully give an
impression of how Knip works under the hood and the level of issues we're
currently dealing with. It's assumed you already have a basic understanding of
Knip (otherwise please consider to read at least [entry files][2] and
[plugins][3] first).

### Case 1: Next.js

Let's say this default configuration respresents, greatly simplified, [the
default `entry` patterns][4] for projects using Next.js:

```json
{
  "next": {
    "entry": ["next.config.ts", "src/pages/**/*.tsx"]
  }
}
```

Those files will be searched for and then statically analyzed to collect
`import` statements and find other local files and external dependencies. This
is the generic way Knip handles all source files.

However, the game changes if the project uses the following Next.js
configuration:

```ts title="next.config.ts"
const nextConfig = {
  pageExtensions: ['page.tsx'],
};

export default nextConfig;
```

Next.js will now look for files matching `src/pages/**/*.page.tsx` instead (note
the subtle change of the glob pattern). Knip should respect this to find used
and unused files properly.

Moving the burden to users for them to either not notice at all and get
incorrect results, or having to override the `next.entry` patterns and include
`src/pages/**/*.page.tsx` isn't good DX. Knip should take care of it.

To get the configuration object and the value of `pageExtensions`, Knip has to
actually load and execute `next.config.ts` ¹... and trouble is right around the
corner:

```ts title="next.config.ts"
const nextConfig = {
  pageExtensions: ['page.tsx'],
  env: {
    BASE_URL: process.env.BASE_URL.toLowerCase(),
  },
};

export default nextConfig;
```

```shell
$ knip
💥 LoaderError: Error loading next.config.ts
💥 Reason: Cannot read properties of undefined (reading 'toLowerCase')
```

Obviously a contrived example, but the gist is that lots of tooling
configuration expects enviroment variables to be defined. But when running Knip
there might not be a mechanism to set those. Clearly a breaking change when Knip
starts doing this, only for Next.js projects with a configuration file that
doesn't read environment variables safely (or has other contextual
dependencies).

By the way, [the ESLint v9 plugin][5] has a similar issue.

¹ Another approach could be to statically analyze the `next.config.ts`
configuration file. That would require some additional efforts and get us only
so far, but is definitely useful in some cases and on the radar.

### Case 2: Knip does that?!

To further bring down user configuration and the number of false positives, the
system required more components. New components have been introduced to keep
improving and nail it for an increasing number of projects. This case is an
illustration of some of those components.

Let's just dive into this example and find out what's happening:

```json title="package.json"
{
  "scripts": {
    "test": "yarn --cwd packages/frontend vitest -c vitest.components.config.ts"
  }
}
```

Orchestration is necessary between various components within Knip, such as:

- Plugins, the Vitest plugin parses `vitest.components.config.ts`
- Custom CLI argument parsing for executables, e.g. `yarn --cwd [dir]` and
  `vitest --config [file]`
- The workspace graph, to see `packages/frontend` is a descendant workspace of
  the root workspace

Patterns like in the script above do not occur only in `package.json` files, but
could be anywhere. Here's a similar example in a GitHub Actions workflow:

```yaml title=".github/workflows/test.yml"
jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - run: playwright test -c playwright.e2e.config.ts
        working-directory: e2e
```

The pattern is very similar, because Knip needs to assign a configuration file
to a specific workspace (assuming there's one in `./e2e`) and apply the Vitest
configuration to that particular workspace with its own set of directory and
entry file patterns.

An essential part of Knip is to build up the module graph for source files. With
the configuration files still in mind, this is the pattern Knip follows towards
this goal:

- Find configuration files at default and custom locations
- Assign them to the right workspace
- Run plugins in their own workspace to take entry file patterns from the
  configuration objects
- Load and parse configuration files to get referenced dependencies

The referenced dependencies are stored in the `DependencyDeputy` class to
eventually determine what dependencies are unused or missing in `package.json`
in each workspace.

Both the configuration and entry files are then used to start building up the
module graph.

## Comprehensive

Discussing the two cases briefly covers only part of the whole process. This
might give a sense of the reason why Knip is pretty comprehensive. After all,
building the module graph for internal source files to find unused files and
exports requires the list of external dependencies including internal
workspaces. And on the other hand, a complete module graph is required to find
unused or missing external dependencies.

The comprehensiveness also requires a range of components in the system, such as
the aforementioned ones, [compilers for popular frameworks][6] and a [script
parser][7], and other affordances such as [auto-fix][8].

That said, code organization could be improved to make it more accessible for
contributions and, for instance, expose programmatic APIs to use the generated
module graph outside of Knip. Additionally, existing plugins can better take
advantage of existing components in the system, and new plugins can be developed
to further reduce user configuration and false positives.

## The End

That's all for today, thanks for reading! Have a great one, and don't forget:
Knip it before you ship it! ✂️

[1]: ../explanations/comparison-and-migration.md
[2]: ../explanations/entry-files.md
[3]: ../explanations/plugins.md
[4]: ../reference/plugins/next.md#default-configuration
[5]: ../reference/plugins/eslint.md#eslint-v9
[6]: ../features/compilers.md
[7]: ../features/script-parser.md
[8]: ../features/auto-fix.mdx
