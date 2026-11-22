import { rules } from './webpack.rules';

export const mainConfig = {
  entry: './src/index.ts',
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};
