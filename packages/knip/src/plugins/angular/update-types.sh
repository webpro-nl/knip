#!/usr/bin/env sh
set -eu
root_dir="$(git rev-parse --show-toplevel)"
angular_plugin_dir="$root_dir/packages/knip/src/plugins/angular"
tmp_dir="$(mktemp -d)"
cleanup() {
  rm  -rf "$tmp_dir"
}
trap cleanup EXIT
git clone --depth 1 https://github.com/angular/angular-cli "$tmp_dir"
cd "$tmp_dir/packages/angular/cli/lib/config"
bunx json-schema-to-typescript -i workspace-schema.json -o "$angular_plugin_dir/types.ts"
"$root_dir/packages/knip/bin/knip-bun.js" --directory "$root_dir" --fix