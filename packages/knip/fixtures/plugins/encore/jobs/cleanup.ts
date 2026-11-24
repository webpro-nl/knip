import { CronJob as Cron } from 'encore.dev/cron';
import { api } from 'encore.dev/api';

export const cleanup = api({}, async () => {});

const _ = new Cron('cleanup', { title: 'Clean up', every: '1h', endpoint: cleanup });
