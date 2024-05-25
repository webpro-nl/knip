export const toRegexOrString = (value: string | RegExp) =>
  typeof value === 'string' && /[*+\\(|{^$]/.test(value) ? new RegExp(value) : value;

export const findMatch = (haystack: undefined | (string | RegExp)[], needle: string) =>
  haystack?.find(n => (typeof n === 'string' ? n === needle : n.test(needle)));
