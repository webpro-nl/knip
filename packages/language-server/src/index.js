import { LanguageServer } from './server.js';

const transports = ['--stdio', '--socket', '--node-ipc', '--pipe'];
if (!process.argv.some(arg => transports.includes(arg))) process.argv.push('--stdio');

new LanguageServer();
