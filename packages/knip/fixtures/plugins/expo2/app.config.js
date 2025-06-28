const config = {
  name: 'Knip',
  platforms: ['android'],
  androidNavigationBar: {
    visible: true,
  },
  android: {
    userInterfaceStyle: 'dark',
  },
  plugins: [
    'expo-camera',
    [
      'expo-router',
      {
        root: 'src/routes',
      },
    ],
  ],
};

export default config;
