export const appConfig = {
  name: 'Test App',
  version: '1.0.0',
  environment: 'development',
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 5000,
  },
  features: {
    enableLogging: true,
    enableMetrics: false,
  },
};
