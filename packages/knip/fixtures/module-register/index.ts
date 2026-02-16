import { register } from 'node:module';
import module from 'node:module';

register('@nodejs-loaders/tsx', import.meta.url);
module.register('@nodejs-loaders/css-module', import.meta.url);
