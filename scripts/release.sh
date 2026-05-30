#!/usr/bin/env bash
set -e

source "$(dirname "$0")/preflight.sh"

# Extra args passed to `pnpm release` (after `--`) are forwarded to every release-it invocation,
# e.g. `pnpm release -- --npm.stage --no-git.requireCleanWorkingDir`
EXTRA=("$@")

# Running the release cycle twice to ensure a single clean commit with multiple tags will be pushed,
# with manual bump/skip for each package separately. One-off package publish can still be done from package dir.

# Start with publish and create release commit for knip core package
pnpm run --dir packages/knip release --no-git.tag --no-git.push --no-github.release "${EXTRA[@]}"

# Bump and publish other packages
BUMP_AND_PUBLISH=(--no-git.changelog --no-git.commitMessage --no-git.tag --no-git.push '--git.commitArgs=--amend --no-edit')
pnpm run --dir packages/create-config release "${BUMP_AND_PUBLISH[@]}" "${EXTRA[@]}"
pnpm run --dir packages/language-server release "${BUMP_AND_PUBLISH[@]}" "${EXTRA[@]}"
pnpm run --dir packages/mcp-server release "${BUMP_AND_PUBLISH[@]}" "${EXTRA[@]}"
pnpm run --dir packages/vscode-knip release "${BUMP_AND_PUBLISH[@]}" "${EXTRA[@]}"

# Tag other packages (this is why we run the show twice: git-amend + git-tag is moving target but we want to keep it clean)
TAG=(--no-git.changelog --no-increment --no-git.commit --no-git.push)
pnpm run --dir packages/create-config release "${TAG[@]}" --no-npm.publish "${EXTRA[@]}"
pnpm run --dir packages/language-server release "${TAG[@]}" --no-npm.publish "${EXTRA[@]}"
pnpm run --dir packages/mcp-server release "${TAG[@]}" --no-npm.publish "${EXTRA[@]}"
pnpm run --dir packages/vscode-knip release "${TAG[@]}" --no-hooks "${EXTRA[@]}"

# End with core knip package to push & release,
pnpm run --dir packages/knip release --no-increment --no-npm.publish --no-git.commit --no-hooks "${EXTRA[@]}"
