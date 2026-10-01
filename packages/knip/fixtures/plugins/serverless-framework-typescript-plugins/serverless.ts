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
      inject: ['./src/libs/commonjs-globals.ts'],
      target: 'node22',
    },
  },
  build: {
    esbuild: {
      inject: ['./src/libs/production-globals.ts'],
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
