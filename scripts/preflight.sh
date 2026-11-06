#!/usr/bin/env bash
set -e

# npm install --global @vscode/vsce ovsx
# brew install azure-cli
# az login --allow-no-subscriptions

curl -sf -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user > /dev/null || { echo 'No or invalid GITHUB_TOKEN'; exit 1; }
vsce verify-pat webpro --azure-credential
ovsx verify-pat webpro
