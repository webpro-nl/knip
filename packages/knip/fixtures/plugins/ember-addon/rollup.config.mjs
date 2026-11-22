import { Addon } from '@embroider/addon-dev/rollup';

const addon = new Addon({ srcDir: 'src', destDir: 'dist' });

export default {
  output: addon.output(),
  plugins: [addon.publicEntrypoints(['index.js', 'basket.js'])],
};
