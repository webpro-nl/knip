import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib-readme.html

const title = 'aws-cdk';

const enablers = ['aws-cdk'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ["cdk.json"];

const production: string[] = [
  '{src/,cdk/,}bin/**/*.{js,ts}',
  '{src/,cdk/,}lib/**/*.{js,ts}',
];



export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
} satisfies Plugin;
