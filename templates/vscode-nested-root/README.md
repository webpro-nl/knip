# vscode-nested-root — repro for PR #1667

The VS Code workspace folder (`repository/`) has **no `package.json`**. The
actual project lives one level down in `repository/frontend/`.

- `repository.code-workspace` opens `./repository` and sets
  `"knip.cwd": "./frontend"`.

## Expected

| Knip root            | Result |
| -------------------- | ------ |
| `repository/` (no `knip.cwd`, current `main`) | ❌ `ERROR: Unable to find package.json` in the Knip Output channel |
| `repository/frontend/` (with `knip.cwd`, PR #1667) | ✅ runs; reports `src/unused.ts` (genuine unused file) |

## CLI check

```sh
cd repository            && knip   # → ERROR: Unable to find package.json
cd repository/frontend && knip   # → src/unused.ts unused (correct)
```

## Test in the editor

```sh
packages/vscode-knip/scripts/dev-install.sh
```

Then open `repository.code-workspace` and watch View → Output → "Knip".
