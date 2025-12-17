# Knip MCP Server

## Knip

Find unused files, dependencies, and exports in your JavaScript/TypeScript
projects.

- Website: [knip.dev][1]
- GitHub repo: [webpro-nl/knip][2]
- Follow [@webpro.nl on Bluesky][3] for updates
- [Sponsor Knip][4]

## VS Code Extension

Install the [Knip VS Code Extension][5] — it comes with the MCP Server included.

## MCP Server

Add to your MCP configuration:

```jsonc
{
  // or "mcpServers"
  "servers": {
    "knip": {
      "command": "npx",
      "args": ["-y", "@knip/mcp"],
    },
  },
}
```

## Prompts

- `knip-configure` — Guided workflow to set up and optimize Knip configuration

## Tools

- `knip-run` — Run Knip, returns configuration hints and issues
- `knip-docs` — Get Knip documentation by topic

## Resources

All pages of the [Knip documentation][1] are available as MCP resources
(`knip://docs/{topic}`).

[1]: https://knip.dev
[2]: https://github.com/webpro-nl/knip
[3]: https://bsky.app/profile/webpro.nl
[4]: https://knip.dev/sponsors
[5]:
  https://github.com/webpro-nl/knip/tree/feat/lang-server-and-vscode-ext/packages/mcp-server
