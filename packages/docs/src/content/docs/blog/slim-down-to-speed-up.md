---
title: Slim down to speed up
date: 2023-12-14
sidebar:
  order: 4
---

_Published: 2023-12-14_

**tl;dr;** Memory usage is up to 50% lower, runs are up to 60% faster and you
can start using v4 canary today. No "unused class members" for the time being,
but this feature is planned to be restored.

## Introduction

Honestly, performance has always been a challenge for Knip. A longstanding
bottleneck has finally been eliminated and Knip is going to be a lot faster.
Skip straight to the bottom to install v4 canary and try it out! Or grab
yourself a nice drink and read on if you're interested in where we are coming
from, and where we are heading.

## Projects & Workspaces

From the start, Knip has relied on TypeScript for its robust parser for
JavaScript and TypeScript files. And on lots of machinery important to Knip,
like module resolution and accurately finding references to exported values.
Parts of it can be customized, such as the (virtual) file system and the module
resolver.

In TypeScript terms, a "project" is like a workspace in a monorepo. Same as each
workspace has a `package.json`, each project has a `tsconfig.json`. The
`ts.createProgram()` method is used to create a program based on a
`tsconfig.json` and the machinery starts to read and parse source code files,
resolve modules, and so on.

Up until v2, when Knip wanted to find unused things in a monorepo, all programs
for all workspaces were loaded into memory. Workspaces often depend on each
other, so Knip couldn't load one project, analyze it and dispose it. This way,
connections across workspaces would be lost.

## Shared Workspaces

Knip v2 said goodbye to this approach and implemented its own TypeScript backend
(after using `ts-morph` for this). Based on the compatibility of
`compilerOptions`, workspaces were merged into shared programs whenever
possible. Having less programs in memory led to significant performance
improvements. Yet ultimately it was still a stopgap, since everything was still
kept in memory for the duration of the process.

"Why does everything need to stay in memory?", you may wonder. The answer is
that Knip uses `findReferences` at the end of the process. Knip relied on this
TypeScript Language Server method for everything that's not easy to find. More
about that later in [the story of findReferences][1]

## Serialization

Fortunately, everything that's imported and exported from source files
(including things like members of namespaces and enums) can be found relatively
easily during AST traversal. This way, references to exports don't have to be
"traced back" later on.

It's mostly class members that are harder to find due to their dynamic nature.
Without these, all information can be serialized for storage and retrieval (in
memory or on disk). Slimming down by taking class members out of the equation
simplifies things a lot and paves the way for all sorts of improvements.

## We Have To Slim Down

The relevant part in the linting process can be summarized in 5 steps:

1. Collect entry files and feed them to TypeScript
2. Read files, resolve modules, and create ASTs
3. Traverse ASTs and collect imports & exports
4. Match exports against imports to determine what's unused
5. Find references to hard-to-find exported values and members

If we would hold on to reporting unused class members, then especially steps 2
and 5 are hard to decouple. The program and the language service containing the
source files used to eventually trace back references can't really be decoupled.
So class members had to go. Sometimes you have to slim down to keep moving. One
step back, two steps forward.

If you rely on this feature, fear not. I plan to bring it back before the final
v4, but possibly behind a flag.

## What's In Store?

So with this out of the way, everything becomes a lot clearer and we can finally
really start thinking about significant memory and performance improvements. So
what's in store here? A lot!

- We no longer need to keep everything in memory, so workspaces are read and
  disposed in isolation, one at a time. Memory usage will be spread out more
  even. This does not make it faster, but reducing "out of memory" issues is
  definitely a Good Thing™️ in my book.
- Knip could recover from unexpected exits and continue from the last completed
  workspace.
- The imports and exports are in a format that can be serialized for storage and
  retrieval. This opens up interesting opportunities, such as local caching on
  disk, skipping work in subsequent runs, remote caching, and so on.
- Handling workspaces in isolation and serialization result in parallelization
  becoming a possibility. This becomes essential, as module resolution and AST
  creation and traversal are now the slowest parts of the process and are not
  easy to optimize significantly (unless perhaps switching to e.g Rust).
- No longer relying on `findReferences` speeds up the export/import matching
  part part significantly. So far I've seen **improvements of up to 60% on total
  runtime**, and my guess is that some larger codebases may profit even more.
- The serialization format is still being explored and there is no caching yet,
  but having the steps more decoupled is another Good Thing™️ that future me
  should be happy about.

## Back It Up, Please

I heard you. Here's some example data. You can get it directly from Knip using
the `--performance` flag when running it on any codebase. Below we have some
data after linting the [Remix monorepo][2].

### Knip v3

```sh
$ knip --performance

Name                           size  min     max      median   sum
-----------------------------  ----  ------  -------  -------  -------
findReferences                  223    0.55  2252.35     8.46  5826.95
createProgram                     2   50.78  1959.92  1005.35  2010.70
getTypeChecker                    2    5.04   667.45   336.24   672.48
getImportsAndExports            396    0.00     7.19     0.11   104.46

Total running time: 9.7s (mem: 1487.39MB)
```

### Knip v4

```sh
$ knip --performance

...

Name                           size  min     max      median   sum
-----------------------------  ----  ------  -------  -------  -------
createProgram                     2   54.36  2138.45  1096.40  2192.81
getTypeChecker                    2    7.40   664.83   336.12   672.23
getImportsAndExports            396    0.00    36.36     0.16   224.37
getSymbolAtLocation            2915    0.00    29.71     0.00    65.63

Total running time: 4.3s (mem: 729.67MB)
```

### Takeaways

The main takeaways here:

- In v3,`findReferences` is where Knip potentially spends most of its time
- In v4, total running time is down over 50%
- In v4, memory usage is down 50% (calculated using
  `process.memoryUsage().heapUsage`)
- In v4, `getImportsAndExports` is more comprehensive to compensate for the
  absence of `findReferences` - more on that below

Remember, unused class members are no longer reported by default in v4.

## The story of `findReferences`

Did I mention Knip uses `findReferences`...? Knip relied on it for everything
that's not easy to find. Here's an example of an export/import match that **is**
easy to find:

```ts title="import.ts"
import { MyThing } from './thing.ts';
```

```ts title="export.ts"
export const MyThing = 'cool';
```

In v2 and v3, Knip collects many of such easy patterns. Other patterns are
harder to find with static analysis. This is especially true for class members.
Let's take a look at the next example:

```ts title="MyClass.ts"
class MyClass {
  constructor() {
    this.method();
  }
  method() {}
  do() {}
}

export const OtherName = MyClass;
```

```ts title="instance.ts"
import * as MyNamespace from './MyClass.ts';

const { OtherName } = MyNamespace;

const instance = new OtherName();

instance.do();
```

Without a call or `new` expression to instantiate `OtherName`, its `method`
member would not be used (since the constructor would not be executed). To
figure this out using static analysis goes a long way. Through export
declarations, import declarations, aliases, initializers, call expressions...
the list goes on and on. Yet all this magic is exactly what happens when you use
"Find all references" or "Go to definition" in VS Code.

Knip used `findReferences` extensively, but it's what makes a part of Knip
rather slow. TypeScript needs to wire things up (through
`ts.createLanguageService` and `program.getTypeChecker`) before it can use this,
and then it tries hard to find all references to anything you throw at it. It
does this very well, but the more class members, enum members and namespaced
imports your codebase has, the longer it inevitably takes to complete the
process.

Besides letting go of class members, a slightly more comprehensive AST traversal
is required to compensate for the absence of `findReferences` (it's the
`getImportsAndExports` function in the metrics above). I'd like to give you an
idea of what "more comprehensive" means here.

In the following example, `referencedExport` was stored as export from
`namespace.ts`, but it was not imported directly as such:

```ts title="namespace.ts"
export const referencedExport = () => {};
```

```ts title="index.ts"
import * as NS from './namespace.ts';

NS.referencedExport();
```

Previously, Knip used `findReferences()` to "trace back" the usage of the
exported `referencedExport`.

The gist of the optimization is to pre-determine all imports and exports. During
AST traversal of `index.ts` , Knip sees that `referencedExport` is attached to
the imported `NS` namespace, and stores that as an imported identifier of
`namespace.ts`. When matching exports against imports, this lookup comes at no
extra cost. Additionally, this can be stored as strings, so it can be serialized
too. And that means it can be cached.

Knip already did this for trivial cases as shown in the first example of this
article. This has now been extended to cover more patterns. This is also what
needs to be tested more extensively before v4 can be released. Its own test
suite and the projects in the integration tests are already covered so we're
well on our way.

For the record, `findReferences` is an absolute gem of functionality provided by
TypeScript. Knip is still backed by TypeScript, and tries to speed things up by
shaking things off. In the end it's all about trade-offs.

## Let's Go!

You can start using Knip v4 today, feel free to try it out! You might find a
false positive that wasn't there in v3, please [report this][3].

```sh
npm install -D knip@canary
```

Remember, Knip it before you ship it! Have a great day ☀️

[1]: #the-story-of-findreferences
[2]: https://github.com/remix-run/remix
[3]: https://github.com/webpro-nl/knip/issues
