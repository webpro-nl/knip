```sh
git clone git@github.com:ericcornelissen/bash-parser.git
cd bash-parser
npm install
npm run build
npx esbuild src/index.js --outfile=$HOME/p/knip/knip/packages/knip/vendor/bash-parser/index.js --bundle --platform=node --format=esm --tree-shaking=true --minify
```
