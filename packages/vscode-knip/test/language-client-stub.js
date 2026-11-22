import { REQUEST_FILE_NODE, REQUEST_PACKAGE_JSON } from '@knip/language-server/constants';

export const TransportKind = { ipc: 1 };
export const clients = [];

export class LanguageClient {
  notifications = new Map();
  file = { exports: [], imports: [] };
  dependenciesUsage = {};
  packageRequests = 0;

  constructor() {
    clients.push(this);
  }

  onNotification(method, listener) {
    this.notifications.set(method, listener);
    return { dispose: () => this.notifications.delete(method) };
  }

  async sendRequest(method) {
    if (method === REQUEST_FILE_NODE) return this.file;
    if (method === REQUEST_PACKAGE_JSON) {
      this.packageRequests++;
      return { dependenciesUsage: this.dependenciesUsage };
    }
  }

  async start() {}
  async stop() {}
  needsStart() {
    return false;
  }
  needsStop() {
    return true;
  }
}
