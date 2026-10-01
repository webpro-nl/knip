import pino, { transport } from 'pino';
const OpenobserveTransport = require('@openobserve/pino-openobserve');

pino.transport({ target: 'pino-pretty' });

pino.transport({
  targets: [
    { target: 'pino-loki', level: 'error' },
    { target: './transports/datadog.mts', options: { destination: '/dev/null' } },
  ],
});

pino.transport({
  pipeline: [
    { target: './transports/transform.mjs' },
    { target: 'pino-mongodb' },
  ],
});

transport({ target: 'pino-syslog' });

pino({ transport: { target: 'pino-elasticsearch' } });

pino({
  transport: {
    targets: [{ target: '@axiomhq/pino' }],
  },
});

pino({
  transport: {
    pipeline: [
      { target: './transports/pipeline-transform.js' },
      { target: 'pino-socket' },
    ],
  },
});

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
