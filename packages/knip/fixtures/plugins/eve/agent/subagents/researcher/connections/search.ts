import { connectionConfig } from 'connection-config';
import { defineMcpClientConnection } from 'eve/connections';

export default defineMcpClientConnection(connectionConfig());
