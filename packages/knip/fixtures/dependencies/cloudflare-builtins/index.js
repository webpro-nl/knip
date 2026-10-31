import { WorkerEntrypoint } from 'cloudflare:workers';
import { connect } from 'cloudflare:sockets';

export default class Worker extends WorkerEntrypoint {
  fetch() {
    return connect('example.com:80');
  }
}
