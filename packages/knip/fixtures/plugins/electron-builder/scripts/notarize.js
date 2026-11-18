const { notarize } = require('@electron/notarize');

exports.default = async context => {
  if (context.electronPlatformName !== 'darwin') return;
  await notarize({ appPath: context.appOutDir });
};
