import type { AWS } from '@serverless/typescript';
import { FUNCTION_TIMEOUTS_IN_SECONDS } from '~/libs/constants';

const config: AWS = {
  service: 'typescript-serverless-plugins',
  frameworkVersion: '4',
  provider: {
    name: 'aws',
    runtime: 'nodejs22.x',
  },
  custom: {
    esbuild: {
      bundle: true,
      target: 'node22',
    },
  },
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-offline-sns', 'serverless-offline-sqs'],
  functions: {
    hello: {
      handler: 'src/functions/hello/handler.main',
      timeout: FUNCTION_TIMEOUTS_IN_SECONDS.hello,
    },
  },
};

export default config;
