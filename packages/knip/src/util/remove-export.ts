import { FIX_FLAGS } from '../constants.ts';

interface FixerOptions {
  text: string;
  start: number;
  end: number;
  flags: number;
}

const lineTerminatorMatcher = /[\n\r\u2028\u2029]/;

const skipTrivia = (text: string, index: number) => {
  let i = index;
  while (i < text.length) {
    if (/\s/.test(text[i])) i++;
    else if (text.startsWith('/*', i)) {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? text.length : end + 2;
    } else if (text.startsWith('//', i)) {
      const end = text.slice(i).search(lineTerminatorMatcher);
      i = end === -1 ? text.length : i + end;
    } else break;
  }
  return i;
};

const getImportAttributesLength = (text: string) => {
  const start = skipTrivia(text, 0);
  const isWith = text.startsWith('with', start);
  const isAssert = !isWith && text.startsWith('assert', start) && !lineTerminatorMatcher.test(text.slice(0, start));
  if (!isWith && !isAssert) return 0;
  let i = skipTrivia(text, start + (isWith ? 4 : 6));
  if (text[i] !== '{') return 0;
  i++;
  while (i < text.length) {
    const char = text[i];
    if (char === '}') return i + 1;
    if (char === "'" || char === '"') {
      i++;
      while (i < text.length && text[i] !== char) i += text[i] === '\\' ? 2 : 1;
      i++;
    } else if (text.startsWith('/*', i) || text.startsWith('//', i)) i = skipTrivia(text, i);
    else i++;
  }
  return 0;
};

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
      const exportLength = beforeBracket.endsWith('export') ? 6 : beforeBracket.endsWith('export type') ? 11 : 0;
      const exportKeywordOffset = beforeBracket.length - exportLength;
      if (exportLength) {
        const fromBracket = afterEnd.substring(closingBracketOffset).trim();
        if (fromBracket.startsWith('from')) {
          const specifierQuoteMatch = afterEnd.match(/['"][^'"]+['"]/);
          if (specifierQuoteMatch?.index) {
            const fromSpecifierLength = specifierQuoteMatch.index + specifierQuoteMatch[0].length;
            const afterSpecifier = afterEnd.substring(fromSpecifierLength);
            const attributesLength = getImportAttributesLength(afterSpecifier);
            return beforeBracket.substring(0, exportKeywordOffset) + afterSpecifier.substring(attributesLength);
          }
        }
        return beforeBracket.substring(0, exportKeywordOffset) + afterEnd.substring(closingBracketOffset);
      }
    }
  }

  return beforeStart + (removeAfterLength === -1 ? afterEnd : afterEnd.substring(removeAfterLength));
};
