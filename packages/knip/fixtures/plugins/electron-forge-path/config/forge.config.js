module.exports = {
  packagerConfig: {
    asar: true,
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: { format: 'ULFO' },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-s3',
      config: { bucket: 'notes-releases' },
    },
  ],
};
