import { defineSkill } from 'eve/skills';

export default defineSkill({
  description: 'Summarize weather data.',
  run: () => 'Sunny',
});
