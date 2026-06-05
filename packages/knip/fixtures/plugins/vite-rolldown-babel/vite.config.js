import babel from '@rolldown/plugin-babel';

export default {
  plugins: [
    babel({
      plugins: ['./some-custom-babel-plugin.js', `babel-plugin-styled-components`],
      presets: [`@babel/preset-env`],
    }),
  ],
};
