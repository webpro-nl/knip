export const $dollar = '$';
export const dollar$ = '$$';
export const _underscore = '_';

export class DollarMembers {
  $member: string;
  member$: string;
  $method: () => string;
  method$: () => string;
}

export class $Dollar {}

export type $DollarType = string;

export enum Characters {
  Used = 1,
  ' ' = ' ',
  '-' = '-',
  ',' = ',',
  ':' = ':',
  '?' = '?',
  '.' = '.',
  '(' = '(',
  ')' = ')',
  '[' = '[',
  ']' = ']',
  '{' = '{',
  '}' = '}',
  '@' = '@',
  '*' = '*',
  '/' = '/',
  '\\' = '\\',
  '+' = '+',
  '|' = '|',
  $ = '$',
  Slash = '/',
  Space = ' ',
}
