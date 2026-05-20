const config = {
  service: 'typescript-serverless-plugins',
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
  },
  build: {
    esbuild: {
      bundle: true,
      minify: false,
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      target: 'node20',
    },
  },
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-offline-sns', 'serverless-offline-sqs'],
  functions: {
    worker: {
      handler: 'src/handler.run',
    },
  },
};

export default config;
