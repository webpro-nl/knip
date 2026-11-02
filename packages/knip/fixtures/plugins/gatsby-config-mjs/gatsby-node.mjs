export const onCreateBabelConfig = ({ actions }) => {
  actions.setBabelPlugin({ name: 'babel-plugin-transform-imports' });
};
