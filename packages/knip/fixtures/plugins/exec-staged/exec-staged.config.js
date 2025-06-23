export default [
  'eslint --max-warnings=0 --cache --fix $FILES',
  { task: 'prettier --write $FILES' },
  'prettier --write --ignore-unknown $FILES',
];
