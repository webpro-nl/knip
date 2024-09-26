import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { FIX_FLAGS } from '../../src/constants.js';
import { removeExport } from '../../src/util/remove-export.js';

const getOpts = (text: string, value: string, flags = FIX_FLAGS.OBJECT_BINDING | FIX_FLAGS.EMPTY_DECLARATION) => {
  const start = text.indexOf(value);
  return { text, start, end: start + value.length, flags };
};

test('Clean export (FIX_FLAGS.NONE)', () => {
  {
    const text = 'export const x = 1;';
    assert.deepEqual(removeExport(getOpts(text, 'export ', 0)), 'const x = 1;');
  }

  {
    const text = 'export default 1';
    assert.deepEqual(removeExport(getOpts(text, 'export default 1', 0)), '');
  }

  {
    const text = 'export default class X {};';
    assert.deepEqual(removeExport(getOpts(text, 'export default ', 0)), 'class X {};');
  }

  {
    const text = 'export = { x,\ny};';
    assert.deepEqual(removeExport(getOpts(text, 'export = { x,\ny}', 0)), ';');
  }

  {
    const text = 'export const [ AB, CD ] = [1, 2];';
    assert.deepEqual(removeExport(getOpts(text, 'AB', 0)), 'export const [ , CD ] = [1, 2];');
  }
});

test('Clean export (FIX_FLAGS.OBJECT_BINDING)', () => {
  {
    const text = 'export const { AB, CD } = {};';
    assert.deepEqual(removeExport(getOpts(text, 'AB', 1)), 'export const {  CD } = {};');
  }

  {
    const text = 'export const { AB: A_B, CD: C_D } = fn();';
    assert.deepEqual(removeExport(getOpts(text, 'AB: A_B', 1)), 'export const {  CD: C_D } = fn();');
  }
});

test('Clean export (FIX_FLAGS.OBJECT_BINDING)', () => {
  {
    const text = 'export enum E { AB = 1, CD = 2 }';
    assert.deepEqual(removeExport(getOpts(text, 'CD = 2', 1)), 'export enum E { AB = 1,  }');
  }

  {
    const text = "export enum E { AB = 'AB', CD = 'CD', }";
    assert.deepEqual(removeExport(getOpts(text, "AB = 'AB'", 1)), "export enum E {  CD = 'CD', }");
  }

  {
    const text = 'export const { AB: A_B, CD: C_D } = fn();';
    assert.deepEqual(removeExport(getOpts(text, 'AB: A_B', 1)), 'export const {  CD: C_D } = fn();');
  }
});

test('Clean export (FIX_FLAGS.EMPTY_DECLARATION)', () => {
  {
    const text = 'export { AB }';
    assert.deepEqual(removeExport(getOpts(text, 'AB')), '');
  }

  {
    const text = 'export { AB, CD }';
    assert.deepEqual(removeExport(getOpts(text, 'AB')), 'export {  CD }');
  }

  {
    const text = 'export { AB, CD, EF }';
    assert.deepEqual(removeExport(getOpts(text, 'CD')), 'export { AB,  EF }');
  }

  {
    const text = 'export { AB, CD } from "specifier"';
    assert.deepEqual(removeExport(getOpts(text, 'CD')), 'export { AB,  } from "specifier"');
  }

  {
    const text = 'export { AB, CD, EF } from "specifier"';
    assert.deepEqual(removeExport(getOpts(text, 'CD')), 'export { AB,  EF } from "specifier"');
  }

  {
    const text = 'export { AB } from "specifier"';
    assert.deepEqual(removeExport(getOpts(text, 'AB')), '');
  }

  {
    const text = "export { AB } from './specifier'";
    assert.deepEqual(removeExport(getOpts(text, 'AB')), '');
  }

  {
    const text = "export { AB as A_B } from './specifier'";
    assert.deepEqual(removeExport(getOpts(text, 'AB as A_B')), '');
  }

  {
    const text = 'export{AB}from"specifier"';
    assert.deepEqual(removeExport(getOpts(text, 'AB')), '');
  }

  {
    const text = 'export{AB}\n\n\n from\n\n\n "specifier"';
    assert.deepEqual(removeExport(getOpts(text, 'AB')), '');
  }

  {
    const text = 'export   {   AB       }     from   "specifier"';
    assert.deepEqual(removeExport(getOpts(text, 'AB')), '');
  }

  {
    const text = 'export type { AB }';
    assert.deepEqual(removeExport(getOpts(text, 'AB')), '');
  }

  {
    const text = 'export { type AB }';
    assert.deepEqual(removeExport(getOpts(text, 'type AB')), '');
  }

  {
    const text = 'export type { AB as A_B }';
    assert.deepEqual(removeExport(getOpts(text, 'AB as A_B')), '');
  }

  {
    const text = 'export { type AB as A_B }';
    assert.deepEqual(removeExport(getOpts(text, 'type AB as A_B')), '');
  }

  {
    const text = 'export { type AB, type CD, type EF }';
    assert.deepEqual(removeExport(getOpts(text, 'type CD')), 'export { type AB,  type EF }');
  }

  {
    const text = 'export { type AB, CD, type EF }';
    assert.deepEqual(removeExport(getOpts(text, 'type AB')), 'export {  CD, type EF }');
  }

  {
    const text = 'export { AB, CD, type EF }';
    assert.deepEqual(removeExport(getOpts(text, 'type EF')), 'export { AB, CD,  }');
  }

  {
    const text = 'export { AB,   \nCD    , \ntype    EF, }';
    assert.deepEqual(removeExport(getOpts(text, 'type    EF')), 'export { AB,   \nCD    , \n }');
  }

  {
    const text = 'export { ,  \ntype    EF, }   from "specifier";';
    assert.deepEqual(removeExport(getOpts(text, 'type    EF')), ';');
  }
});
