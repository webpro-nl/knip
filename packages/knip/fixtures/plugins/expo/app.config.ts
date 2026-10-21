import path from 'node:path';
import withFunction from './plugins/withFunction';

const config = {
  name: 'Knip',
  updates: {
    enabled: true,
  },
  notification: {
    color: '#ffffff',
  },
  userInterfaceStyle: 'automatic',
  ios: {
    backgroundColor: '#ffffff',
  },
  plugins: [
    ['@config-plugins/detox', { subdomains: '*' }],
    '@sentry/react-native/expo',
    ['expo-splash-screen', { backgroundColor: '#ffffff' }],
    './plugins/withAndroidManifest',
    ['./plugins/withIosEntitlements', { team: 'knip' }],
    path.join(__dirname, 'plugins/withAbsolute'),
    withFunction,
  ],
};

export default config;
