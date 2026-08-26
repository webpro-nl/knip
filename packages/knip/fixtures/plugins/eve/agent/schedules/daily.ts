import { defineSchedule } from 'eve/schedules';
import { getWeather } from '../lib/weather.js';

export default defineSchedule({
  cron: '0 8 * * *',
  run: () => getWeather('Amsterdam'),
});
