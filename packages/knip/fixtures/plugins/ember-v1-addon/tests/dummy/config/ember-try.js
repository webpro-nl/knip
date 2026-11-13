const getChannelURL = require('ember-source-channel-url');
module.exports = async () => ({ scenarios: [{ name: 'ember-release', npm: { devDependencies: { 'ember-source': await getChannelURL('release') } } }] });
