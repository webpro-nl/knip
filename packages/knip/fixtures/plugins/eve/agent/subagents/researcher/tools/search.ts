import { defineTool } from 'eve/tools';
import { getWeather } from '../../../lib/weather.js';

export default defineTool({
  description: 'Search for weather data.',
  execute: ({ city }: { city: string }) => getWeather(city),
});
