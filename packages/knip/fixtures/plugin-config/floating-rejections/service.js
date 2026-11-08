const pending = [];

module.exports = {
  start: () => setInterval(() => pending.splice(0).forEach(reject => reject(new Error('service boom'))), 20).unref(),
  request: () => new Promise((_resolve, reject) => pending.push(reject)),
};
