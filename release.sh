#!/usr/bin/env bash
set -e

pnpm run --dir packages/knip release --no-git.push
pnpm run --dir packages/language-server release --no-git.changelog --no-git.commit --no-git.push
pnpm run --dir packages/mcp-server release --no-git.changelog --no-git.commit --no-git.push
pnpm run --dir packages/vscode-knip publish --no-git.changelog --no-git.commit
