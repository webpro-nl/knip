import { evalite } from 'evalite';

evalite('Summary', {
  data: [{ input: 'text', expected: 'text' }],
  task: input => input,
  scorers: [],
});
