export default {
  turbopack: {
    rules: { '*.txt': { loaders: ['./loader.cjs'], as: '*.js' } },
  },
};
