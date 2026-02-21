import pino, { transport } from 'pino';
const OpenobserveTransport = require('@openobserve/pino-openobserve');

pino.transport({ target: 'pino-pretty' });

pino.transport({
  targets: [
    { target: 'pino-datadog-transport', level: 'error' },
    { target: './my-transport.mts', options: { destination: '/dev/null' } },
  ],
});

transport({ target: 'pino-pretty' });

pino.transport({ target: './my-transport.js' });

pino({ transport: { target: 'pino-pretty' } });

pino({
  level: 'info',
  transport: {
    target: OpenobserveTransport,
  },
});

// TODO support ref
const transports = [
  { target: 'pino/file', options: { destination: 1 } },
  { target: 'my-custom-transport', options: { someParameter: true } },
];

pino(pino.transport({ targets: transports }));
