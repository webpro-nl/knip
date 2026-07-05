import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOPIC_NAME } from '~/libs/constants';
import handlerPath from '~/libs/handler-resolver';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const processNewFile = {
  events: [
    {
      sns: {
        topicName: TOPIC_NAME,
      },
    },
  ],
  handler: `${handlerPath(__dirname)}/handler.default`,
};
