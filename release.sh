#!/usr/bin/env bash
set -e

# Bump and publish all, create single commit
pnpm run --dir packages/knip release --no-git.tag --no-git.push --no-github.release
pnpm run --dir packages/language-server release --no-git.changelog --no-git.commitMessage --no-git.tag --no-git.push '--git.commitArgs=--amend --no-edit'
pnpm run --dir packages/mcp-server release --no-git.changelog --no-git.commitMessage --no-git.tag --no-git.push '--git.commitArgs=--amend --no-edit'
pnpm run --dir packages/vscode-knip release --no-git.changelog --no-git.commitMessage --no-git.tag --no-git.push '--git.commitArgs=--amend --no-edit'

# Tag all, push once, github release
pnpm run --dir packages/language-server release --no-git.changelog --no-increment --no-npm.publish --no-git.commit --no-git.push
pnpm run --dir packages/mcp-server release --no-git.changelog --no-increment --no-npm.publish --no-git.commit --no-git.push
pnpm run --dir packages/vscode-knip release --no-git.changelog --no-increment --no-git.commit --no-git.push --no-hooks
pnpm run --dir packages/knip release --no-increment --no-npm.publish --no-git.commit --no-hooks
