#!/usr/bin/env bash
set -e

pnpm run --dir packages/knip release
pnpm run --dir packages/language-server release --no-git.changelog --no-git.push
pnpm run --dir packages/mcp-server release --no-git.changelog --no-git.push
pnpm run --dir packages/vscode-knip release --no-git.changelog
