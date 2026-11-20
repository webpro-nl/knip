import { task } from '@trigger.dev/sdk';
import { greet } from '../utils/greet.ts';

export const helloWorld = task({
  id: 'hello-world',
  run: async (payload: { name: string }) => greet(payload.name),
});
