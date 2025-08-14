const api = require.context('./api', false, /\.js$/);
const services = require.context('./services', true, /\.(js|ts)$/);
const tests = require.context('./services', true, /\.test\.js$/);
const utils = require.context('./utils', false, /^helper-.*\.js$/gi);
const allFiles = require.context('./', true, /^\.\/.*\.(js|ts)$/);

export { api, services, tests, utils, allFiles };
