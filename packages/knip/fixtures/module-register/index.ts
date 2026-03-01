import { register } from 'node:module';
import module from 'module';

register('@nodejs-loaders/tsx', import.meta.url);
module.register('@nodejs-loaders/css-module', import.meta.url);

register('./loader.js', import.meta.url);

register('./ignored-loader.js', new URL('.', import.meta.url).href);

register('./ignored-loader.js', 'data:');

register('./ignored-loader.js', '..');

register('./ignored-loader.js');
