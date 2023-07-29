export function stripQuotes(name: string) {
  const length = name.length;
  if (length >= 2 && name.charCodeAt(0) === name.charCodeAt(length - 1) && isQuoteOrBacktick(name.charCodeAt(0))) {
    return name.substring(1, length - 1);
  }
  return name;
}

const enum CharacterCodes {
  backtick = 0x60,
  doubleQuote = 0x22,
  singleQuote = 0x27,
}

function isQuoteOrBacktick(charCode: number) {
  return (
    charCode === CharacterCodes.singleQuote ||
    charCode === CharacterCodes.doubleQuote ||
    charCode === CharacterCodes.backtick
  );
}
