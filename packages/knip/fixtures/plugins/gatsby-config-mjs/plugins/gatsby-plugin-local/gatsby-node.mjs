export const onCreateBabelConfig = ({ actions }) => {
  actions.setBabelPlugin({ name: 'babel-plugin-from-local-plugin' });
};
