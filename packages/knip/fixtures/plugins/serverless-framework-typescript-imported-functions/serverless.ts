import type { AWS } from '@serverless/typescript';
import { processNewFile } from './src/functions/process-new-file';

const config: AWS = {
  service: 'typescript-serverless-imported-functions',
  frameworkVersion: '4',
  provider: {
    name: 'aws',
    runtime: 'nodejs22.x',
  },
  custom: {
    SECRETS: '${file(./scripts/secrets.cjs):getSecrets}',
    esbuild: {
      inject: ['./scripts/cjs-shim.mjs'],
      target: 'node22',
    },
  },
  plugins: ['serverless-esbuild'],
  functions: {
    processNewFile,
  },
};

export default config;
