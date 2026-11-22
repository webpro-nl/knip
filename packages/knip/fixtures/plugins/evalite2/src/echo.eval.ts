import { evalite } from 'evalite';

evalite('Echo', {
  data: [{ input: 'text', expected: 'text' }],
  task: input => input,
  scorers: [],
});
