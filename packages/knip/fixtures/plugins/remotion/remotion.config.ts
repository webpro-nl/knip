import { Config } from '@remotion/cli/config';
import { customizeWebpack } from './src/bundler-helper';

Config.setVideoImageFormat('jpeg');
Config.overrideWebpackConfig(customizeWebpack);
