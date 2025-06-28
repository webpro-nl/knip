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
  ],
};

export default config;
