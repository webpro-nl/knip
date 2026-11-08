module.exports = async () => {
  Promise.reject(new Error('boom'));
  await new Promise(resolve => setTimeout(resolve, 50));
  return {};
};
