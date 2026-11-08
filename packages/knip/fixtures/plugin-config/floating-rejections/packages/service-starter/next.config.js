const service = require('../../service.js');

service.start();

module.exports = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {};
};
