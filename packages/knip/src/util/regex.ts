export const toRegexOrString = (value: string | RegExp) =>
  typeof value === 'string' && /[*+\\(|{^$]/.test(value) ? new RegExp(value) : value;

export const hasMatch = (haystack: undefined | (string | RegExp)[], needle: string) =>
  haystack && haystack.some(n => (typeof n === 'string' ? n === needle : n.test(needle)));

export const hasMatchInSet = (haystack: undefined | Set<string>, needle: string | RegExp) =>
  haystack && (typeof needle === 'string' ? haystack.has(needle) : [...haystack].some(n => needle.test(n)));

export const hasMatchInArray = (haystack: string[], needle: string | RegExp) =>
  typeof needle === 'string' ? haystack.includes(needle) : haystack.some(n => needle.test(n));

export const findKey = (map: Map<string | RegExp, unknown>, key: RegExp) =>
  [...map.keys()].find(k => k instanceof RegExp && k.source === key.source);
