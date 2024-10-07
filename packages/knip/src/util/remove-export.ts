import { FIX_FLAGS } from '../constants.js';

interface FixerOptions {
  text: string;
  start: number;
  end: number;
  flags: number;
}

const getOpeningBracketIndex = (text: string) => {
  let bracketOpenIndex = -1;
  let j = text.length - 1;
  while (j >= 0) {
    const char = text[j];
    if (char === '{') {
      bracketOpenIndex = j;
      break;
    }
    if (!/\s/.test(char) && char !== ',') {
      if (text.substring(j - 3, j + 1) === 'type') {
        j = j - 4;
        continue;
      }
      break;
    }
    j--;
  }
  return bracketOpenIndex;
};

export const removeExport = ({ text, start, end, flags }: FixerOptions) => {
  const beforeStart = text.substring(0, start);
  const afterEnd = text.substring(end);

  if (flags % FIX_FLAGS.NONE) return beforeStart + afterEnd;

  const subject = text.substring(start, end).trim();
  if (subject === 'export' || subject === 'export default') return beforeStart + afterEnd;

  let closingBracketOffset = -1;
  let removeAfterLength = -1;

  if (flags & FIX_FLAGS.OBJECT_BINDING) {
    let i = 0;
    while (i <= afterEnd.length) {
      const char = afterEnd[i];
      if (char === ',') {
        removeAfterLength = i + 1;
      } else if (flags & FIX_FLAGS.WITH_NEWLINE && (char === '\n' || char === '\r' || char === '\r\n')) {
        removeAfterLength = i + 1;
      } else if (char === '}') {
        closingBracketOffset = i + 1;
        if (flags & FIX_FLAGS.WITH_NEWLINE) removeAfterLength = i;
        break;
      } else if (!/\s/.test(char)) {
        if (flags & FIX_FLAGS.WITH_NEWLINE) removeAfterLength = i;
        break;
      }
      i++;
    }
  }

  if (flags & FIX_FLAGS.EMPTY_DECLARATION && closingBracketOffset !== -1) {
    const openingBracketIndex = getOpeningBracketIndex(beforeStart);
    if (closingBracketOffset !== -1 && openingBracketIndex !== -1) {
      const beforeBracket = beforeStart.substring(0, openingBracketIndex).trim();
      const exportLength = beforeBracket.endsWith('export') ? 6 : beforeBracket.endsWith('export type') ? 12 : 0;
      const exportKeywordOffset = beforeBracket.length - exportLength;
      if (exportLength) {
        const fromBracket = afterEnd.substring(closingBracketOffset).trim();
        if (fromBracket.startsWith('from')) {
          const specifierQuoteMatch = afterEnd.match(/['"][^'"]+['"]/);
          if (specifierQuoteMatch?.index) {
            const fromSpecifierLength = specifierQuoteMatch.index + specifierQuoteMatch[0].length;
            return beforeBracket.substring(0, exportKeywordOffset) + afterEnd.substring(fromSpecifierLength);
          }
        }
        return beforeBracket.substring(0, exportKeywordOffset) + afterEnd.substring(closingBracketOffset);
      }
    }
  }

  return beforeStart + (removeAfterLength === -1 ? afterEnd : afterEnd.substring(removeAfterLength));
};
