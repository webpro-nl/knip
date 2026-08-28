<h1 align="center">
  <br />
  <a href="https://knip.dev">
    <img height="200" width="200" src="https://knip.dev/favicon.svg" alt="Knip" />
  </a>
  <br />
  <br />
</h1>

<div align="center">

[![NPM Version][2]][1] [![NPM Downloads][3]][1] [![GitHub Repo stars][5]][4]
[![License][7]][6] [![Contributors][9]][8]

</div>

**Knip finds and fixes unused dependencies, exports and files in your JavaScript
and TypeScript projects.** Less code and fewer dependencies lead to improved
performance, less maintenance and easier refactorings.

## What Knip does

Knip analyzes your project's module graph, configuration and source code to
surface everything you no longer need — so you can safely delete it:

- **Unused files** — files that are never referenced from anywhere.
- **Unused and duplicate exports** — dead code that quietly ships in the
  dependency graph.
- **Unused and unlisted dependencies** — packages you no longer import, or
  import but forgot to declare.
- **Unused types, enum members and namespace members** — the invisible orphans.
- **Unlisted binaries** — commands used in scripts but missing from
  dependencies.

Fewer surprises, a leaner codebase, and a project that's easier to navigate.

## Quick start

Knip runs out of the box with sensible defaults and zero configuration:

```sh
npx knip
```

It's fast, safe, and works incrementally with your existing setup — including
workspaces, monorepos and [dozens of plugins][12] for popular tools and
frameworks. See the [getting started guide][13] for configuration, and read the
[documentation][14] to go deeper.

## Official resources

- Website: [knip.dev][14]
- GitHub repo: [webpro-nl/knip][4]
- Official npm packages: [knip][1], [@knip/create-config][15],
  [@knip/language-server][16], [@knip/mcp][17]
- [Knip on the VS Code Marketplace][18], [Knip on the Open VSX Registry][19]
- [Contributing Guide][10]
- Follow [@webpro.nl on Bluesky][20] for updates
- [Sponsor Knip!][21]

## Contributors

Knip wouldn't exist without [the wonderful people who have contributed to
it][8]! Here they all are:

<div align="center">

<a href="https://github.com/webpro-nl/knip/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=webpro-nl/knip&max=1000" />
</a>

</div>

_Contributor avatars are rendered live and update automatically as new
contributors join — every one of them deserves a round of applause._

Want to help? Read the [contributing guide][10] and feel free to open an issue
or a pull request.

## Knip

/'knɪp/ means "(to) cut" and is [pronounced with a hard "K"][22] 🇳🇱

## License

Knip is free and open-source software licensed under the [ISC License][6].

Parts of Knip have been inspired by and/or partially copy code from the
following projects:

- [@npmcli/package-json][23] ([ISC][24])
- [@pnpm/deps.graph-sequencer][25] ([MIT][26])
- [file-entry-cache][27] ([MIT][28])
- [json-parse-even-better-errors][29] ([MIT][30])

[1]: https://www.npmx.dev/package/knip
[2]: https://img.shields.io/npm/v/knip?style=for-the-badge&color=f56e0f&logo=npm&logoColor=white
[3]: https://img.shields.io/npm/dm/knip?style=for-the-badge&color=f56e0f&logo=npm&logoColor=white
[4]: https://github.com/webpro-nl/knip
[5]: https://img.shields.io/github/stars/webpro-nl/knip?style=for-the-badge&color=f56e0f&logo=github&logoColor=white
[6]: ./LICENSE
[7]: https://img.shields.io/badge/license-ISC-f56e0f?style=for-the-badge&logo=git&logoColor=white
[8]: https://github.com/webpro-nl/knip/graphs/contributors
[9]: https://img.shields.io/github/contributors/webpro-nl/knip?style=for-the-badge&color=f56e0f&logo=github&logoColor=white
[10]: https://github.com/webpro-nl/knip/blob/main/.github/CONTRIBUTING.md
[11]: https://img.shields.io/badge/PRs-welcome-f56e0f?style=for-the-badge&logo=git&logoColor=white
[12]: https://knip.dev/reference/plugins
[13]: https://knip.dev/overview/getting-started
[14]: https://knip.dev
[15]: https://www.npmx.dev/package/@knip/create-config
[16]: https://www.npmx.dev/package/@knip/language-server
[17]: https://www.npmx.dev/package/@knip/mcp
[18]: https://marketplace.visualstudio.com/items?itemName=webpro.vscode-knip
[19]: https://open-vsx.org/extension/webpro/vscode-knip
[20]: https://bsky.app/profile/webpro.nl
[21]: https://knip.dev/sponsors
[22]: https://www.youtube.com/watch?v=PE7h7KvQoUI&t=9s
[23]: https://github.com/npm/package-json
[24]: https://github.com/npm/package-json/blob/main/LICENSE
[25]: https://github.com/pnpm/pnpm/tree/main/deps/graph-sequencer
[26]: https://github.com/pnpm/pnpm/blob/main/LICENSE
[27]: https://github.com/jaredwray/cacheable/tree/main/packages/file-entry-cache
[28]: https://github.com/jaredwray/cacheable/blob/main/packages/file-entry-cache/LICENSE
[29]: https://github.com/npm/json-parse-even-better-errors
[30]: https://github.com/npm/json-parse-even-better-errors/blob/main/LICENSE.md
