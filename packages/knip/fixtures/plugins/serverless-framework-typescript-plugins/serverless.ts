import type { AWS } from '@serverless/typescript';

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
    },
  },
};

export default config;
