import { defineAgent } from 'eve';

export default defineAgent({
  description: 'Research weather data before the parent agent responds.',
  model: 'openai/gpt-5',
});
