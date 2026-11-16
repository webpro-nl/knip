module.exports = async request => ({
  appId: `com.example.${request.packageKey}`,
  afterPack: './hooks/after-pack.cjs',
});
