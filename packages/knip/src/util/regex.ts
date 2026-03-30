const isRegexLikeMatch = /[*+\\(|{^$]/;
const isRegexLike = (value: string) => isRegexLikeMatch.test(value);

export const toRegexOrString = (value: string | RegExp) =>
  typeof value === 'string' && isRegexLike(value) ? new RegExp(value) : value;

export const findMatch = (haystack: (string | RegExp)[], needle: string) =>
  haystack.find(n => (typeof n === 'string' ? n === needle : n.test(needle)));
