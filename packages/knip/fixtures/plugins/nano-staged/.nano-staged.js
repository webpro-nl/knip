export default {
  '*.(js|ts|tsx)': ['eslint --max-warnings=0 --cache --fix .', 'prettier --write .'],
  '*.!(js|ts|tsx)': api => `prettier --write --ignore-unknown ${api.filenames.join(' ')}`,
};
