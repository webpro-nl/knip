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

</div>

Knip finds and fixes **unused dependencies, exports and files** in your
JavaScript and TypeScript projects. Less code and dependencies lead to improved
performance, less maintenance and easier refactorings.

- Website: [knip.dev][6]
- GitHub repo: [webpro-nl/knip][4]
- Official npm packages: [knip][1], [@knip/create-config][7],
  [@knip/language-server][8], [@knip/mcp][9]
- [Knip on the VS Code Marketplace][10], [Knip on the Open VSX Registry][11]
- [Contributing Guide][12]
- Follow [@webpro.nl on Bluesky][13] for updates
- [Sponsor Knip!][14]

## Getting started

Install Knip and run it to lint your project:

```shell
npm init @knip/config
npm run knip
```

See [Getting Started][15] for more package managers and installation options.

## Coding agents

Let your coding agent configure Knip using the [Knip MCP Server][16]:

```text
Install the Knip MCP Server (@knip/mcp) and use it to configure Knip in this
project.
```

You may need to restart your agent session after installing the server.

## Contributors

Special thanks to [the wonderful people who have contributed to Knip][17]!

## Knip

/'knɪp/ means "(to) cut" and is [pronounced with a hard "K"][18] 🇳🇱

## License

Knip is free and open-source software licensed under the [ISC License][19].

Parts of Knip have been inspired by and/or partially copy code from the
following projects:

- [@npmcli/package-json][20] ([ISC][21])
- [@pnpm/deps.graph-sequencer][22] ([MIT][23])
- [file-entry-cache][24] ([MIT][25])
- [json-parse-even-better-errors][26] ([MIT][27])

[1]: https://www.npmx.dev/package/knip
[2]: https://img.shields.io/npm/v/knip?color=f56e0f
[3]: https://img.shields.io/badge/dynamic/json?url=https://npm-gapless.webpro.nl/downloads/range/last-month/knip&query=$.totalCompact&label=downloads&suffix=/month&color=f56e0f
[4]: https://github.com/webpro-nl/knip
[5]: https://img.shields.io/github/stars/webpro-nl/knip?style=flat&color=f56e0f
[6]: https://knip.dev
[7]: https://www.npmx.dev/package/@knip/create-config
[8]: https://www.npmx.dev/package/@knip/language-server
[9]: https://www.npmx.dev/package/@knip/mcp
[10]: https://marketplace.visualstudio.com/items?itemName=webpro.vscode-knip
[11]: https://open-vsx.org/extension/webpro/vscode-knip
[12]: https://github.com/webpro-nl/knip/blob/main/.github/CONTRIBUTING.md
[13]: https://bsky.app/profile/webpro.nl
[14]: https://knip.dev/sponsors
[15]: https://knip.dev/overview/getting-started
[16]: https://knip.dev/reference/integrations#mcp-server
[17]: https://knip.dev/#created-by-awesome-contributors
[18]: https://www.youtube.com/watch?v=PE7h7KvQoUI&t=9s
[19]: ./LICENSE
[20]: https://github.com/npm/package-json
[21]: https://github.com/npm/package-json/blob/main/LICENSE
[22]: https://github.com/pnpm/pnpm/tree/main/deps/graph-sequencer
[23]: https://github.com/pnpm/pnpm/blob/main/LICENSE
[24]: https://github.com/jaredwray/cacheable/tree/main/packages/file-entry-cache
[25]: https://github.com/jaredwray/cacheable/blob/main/packages/file-entry-cache/LICENSE
[26]: https://github.com/npm/json-parse-even-better-errors
[27]: https://github.com/npm/json-parse-even-better-errors/blob/main/LICENSE.md
