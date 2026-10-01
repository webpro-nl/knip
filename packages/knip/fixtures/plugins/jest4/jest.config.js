module.exports = {
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    ],
  },
};
