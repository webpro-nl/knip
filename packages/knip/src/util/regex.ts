export const toRegexOrString = (value: string | RegExp) =>
  typeof value === 'string' && /[*+\\(|{^$]/.test(value) ? new RegExp(value) : value;

export const findMatch = (haystack: undefined | (string | RegExp)[], needle: string) =>
  haystack?.find(n => (typeof n === 'string' ? n === needle : n.test(needle)));

const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
const reHasRegExpChar = RegExp(reRegExpChar.source);

/** 
 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
 * copy from lodash, see: https://github.com/lodash/lodash/blob/main/src/escapeRegExp.ts */
export const escapeRegExp = (str: string) => {
  return str && reHasRegExpChar.test(str)
    ? str.replace(reRegExpChar, '\\$&')
    : str || '';
}
