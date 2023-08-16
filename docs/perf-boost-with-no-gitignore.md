# Potential boost with `--no-gitignore`

Running Knip on large monorepos with many workspaces may feel a bit sluggish. Knip looks up `.gitignore` files and uses
them to filter out matching entry and project files. This increases correctness. However, you might want to disable that
with `--no-gitignore` and enjoy a significant performance boost. Depending on the contents of the `.gitignore` files,
the reported issues may be the same.

To help determine whether this trade-off might be worth it for you, first check the difference in unused files:

```shell
diff <(knip --no-gitignore --include files) <(knip --include files)
```

And to measure the difference of this flag in seconds:

```shell
SECONDS=0; knip > /dev/null; t1=$SECONDS; SECONDS=0; knip --no-gitignore > /dev/null; t2=$SECONDS; echo "Difference: $((t1 - t2)) seconds"
```

Analysis on a large project went down from 33 to 9 seconds (that's >70% faster).
