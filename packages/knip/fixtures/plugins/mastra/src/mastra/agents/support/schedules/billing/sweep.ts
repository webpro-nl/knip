import { defineSchedule } from '@mastra/core/schedules';

export default defineSchedule({ cron: '0 9 * * *', prompt: 'Review overdue invoices.' });
