const isRegexLikeMatch = /[*+\\(|{^$]/;
const isRegexLike = (value: string) => isRegexLikeMatch.test(value);

export const toRegexOrString = (value: string | RegExp) => {
  if (typeof value !== 'string' || !isRegexLike(value)) return value;
  try {
    return new RegExp(value);
  } catch {
    // Not a valid regex (e.g. "g++"), so match the value literally
    return value;
  }
};

export const findMatch = (haystack: (string | RegExp)[], needle: string) =>
  haystack.find(n => (typeof n === 'string' ? n === needle : n.test(needle)));
