#!/usr/bin/env bash
set -e

# Formatters skip fixtures, so CRLF can only be caught against what Git stored
files=$(git ls-files --eol | grep -E '^i/(crlf|mixed).*eol=lf' | cut -f2)

if [ -n "$files" ]; then
  echo 'Stored with CRLF while .gitattributes says LF:' >&2
  echo "$files" >&2
  echo 'Run `git add --renormalize` on them and commit' >&2
  exit 1
fi
