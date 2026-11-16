module.exports = async request => {
  const metadata = await request.packageMetadata.value;
  return {
    appId: `com.example.${metadata.name.replace(/\W/g, '')}`,
    afterPack: './hooks/after-pack.cjs',
  };
};
