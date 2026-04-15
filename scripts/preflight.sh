#!/usr/bin/env bash
set -e

curl -sf -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user > /dev/null || { echo 'No or invalid GITHUB_TOKEN'; exit 1; }
vsce verify-pat webpro
ovsx verify-pat webpro
npm whoami > /dev/null 2>&1 || { [ -t 0 ] && npm login || { echo 'Not logged in to npm, run `npm login`' >&2; exit 1; }; }
