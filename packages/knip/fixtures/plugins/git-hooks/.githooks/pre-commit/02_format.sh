#!/bin/bash
./node_modules/.bin/prettier --check .
node ./scripts/check-staged.js
