import { schedules } from '@trigger.dev/sdk';

export const cleanup = schedules.task({
  id: 'cleanup',
  cron: '0 0 * * *',
  run: async () => {},
});
