import { evalite } from 'evalite';
import { answer } from './answer.ts';

evalite('Answer', {
  data: [{ input: 'question', expected: 'Answer to question' }],
  task: answer,
  scorers: [],
});
