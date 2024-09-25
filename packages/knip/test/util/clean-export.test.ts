import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { cleanExport } from '../../src/util/clean-export.js';

const getOpts = (text: string, value: string) => {
  const start = text.indexOf(value);
  return { text, start, end: start + 2, isCleanable: true };
};

test('fixer', () => {
  {
    const text = 'export { AB }';
    assert.deepEqual(cleanExport(getOpts(text, 'AB')), '');
  }

  {
    const text = 'export { AB, CD }';
    assert.deepEqual(cleanExport(getOpts(text, 'AB')), 'export {  CD }');
  }

  {
    const text = 'export { AB, CD, EF }';
    assert.deepEqual(cleanExport(getOpts(text, 'CD')), 'export { AB,  EF }');
  }

  {
    const text = 'export { AB, CD } from "specifier"';
    assert.deepEqual(cleanExport(getOpts(text, 'CD')), 'export { AB,  } from "specifier"');
  }

  {
    const text = 'export { AB, CD, EF } from "specifier"';
    assert.deepEqual(cleanExport(getOpts(text, 'CD')), 'export { AB,  EF } from "specifier"');
  }

  {
    const text = 'export { AB } from "specifier"';
    assert.deepEqual(cleanExport(getOpts(text, 'AB')), '');
  }

  {
    const text = "export { AB } from './specifier'";
    assert.deepEqual(cleanExport(getOpts(text, 'AB')), '');
  }

  {
    const text = 'export{AB}from"specifier"';
    assert.deepEqual(cleanExport(getOpts(text, 'AB')), '');
  }

  {
    const text = 'export   {   AB       }     from   "specifier"';
    assert.deepEqual(cleanExport(getOpts(text, 'AB')), '');
  }
});
