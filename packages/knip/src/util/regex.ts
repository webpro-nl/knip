export const toRegexOrString = (value: string | RegExp) =>
  typeof value === 'string' && /[*+\\(|{^$]/.test(value) ? new RegExp(value) : value;

export const findMatch = (haystack: undefined | (string | RegExp)[], needle: string) =>
  haystack?.find(n => (typeof n === 'string' ? n === needle : n.test(needle)));

/**
 * Escapes a string to be used in a regular expression.
 *
 * Escapes all characters that have a special meaning in regular expressions.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}
