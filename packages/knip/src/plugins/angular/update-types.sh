#!/usr/bin/env sh
set -eu
angular_plugin_dir="$(cd "$(dirname "$0")" && pwd)"
tmp_dir="$(mktemp -d)"
cleanup() {
  rm  -rf "$tmp_dir"
}
trap cleanup EXIT
git clone --depth 1 https://github.com/angular/angular-cli "$tmp_dir"
cd "$tmp_dir/packages/angular/cli/lib/config"
bunx json-schema-to-typescript -i workspace-schema.json -o "$angular_plugin_dir/types.ts";
rm -rf "$tmp_dir"
