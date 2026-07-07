import { defineTool } from 'eve/tools';
import { getWeather } from '../lib/weather.js';

export default defineTool({
  description: 'Get the weather for a city.',
  execute: ({ city }: { city: string }) => getWeather(city),
});
