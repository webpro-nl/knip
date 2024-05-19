export const toRegexOrString = (value: string | RegExp) =>
  typeof value === 'string' && /[*+\\(|{^$]/.test(value) ? new RegExp(value) : value;

export const hasMatch = (haystack: undefined | (string | RegExp)[], needle: string) =>
  haystack?.some(n => (typeof n === 'string' ? n === needle : n.test(needle)));

export const hasMatchInSet = (haystack: undefined | Set<string>, needle: string | RegExp) =>
  haystack && (typeof needle === 'string' ? haystack.has(needle) : [...haystack].some(n => needle.test(n)));
