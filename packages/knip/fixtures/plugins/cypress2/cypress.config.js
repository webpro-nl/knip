import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    specPattern: '**/*.e2e.js',
    reporter: 'mochawesome',
  },
  component: {
    specPattern: ['**/*.component.js'],
    reporter: 'mocha-junit-reporter',
  },
});
