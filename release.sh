#!/usr/bin/env bash
set -e

# Running the release cycle twice to ensure a single clean commit with multiple tags will be pushed,
# with manual bump/skip for each package separately. One-off package publish can still be done from package dir.

# Start with publish and create release commit for knip core package
pnpm run --dir packages/knip release --no-git.tag --no-git.push --no-github.release

# Bump and publish other packages
BUMP_AND_PUBLISH="--no-git.changelog --no-git.commitMessage --no-git.tag --no-git.push '--git.commitArgs=--amend --no-edit'"
pnpm run --dir packages/language-server release "$BUMP_AND_PUBLISH"
pnpm run --dir packages/mcp-server release "$BUMP_AND_PUBLISH"
pnpm run --dir packages/vscode-knip release "$BUMP_AND_PUBLISH"

# Tag other packages (this is why we run the show twice: git-amend + git-tag is moving target but we want to keep it clean)
TAG="--no-git.changelog --no-increment --no-git.commit --no-git.push"
pnpm run --dir packages/language-server release "$TAG" --no-npm.publish
pnpm run --dir packages/mcp-server release "$TAG" --no-npm.publish
pnpm run --dir packages/vscode-knip release "$TAG" --no-hooks

# End with core knip package to push & release,
pnpm run --dir packages/knip release --no-increment --no-npm.publish --no-git.commit --no-hooks
