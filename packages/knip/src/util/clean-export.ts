interface FixerOptions {
  text: string;
  start: number;
  end: number;
  isCleanable: boolean;
}

export const cleanExport = ({ text, start, end, isCleanable }: FixerOptions) => {
  const beforeStart = text.substring(0, start);
  const afterEnd = text.substring(end);
  const exportKeyword = text.substring(start, end).trim();

  if (exportKeyword === 'export' || exportKeyword === 'export default') return beforeStart + afterEnd;
  if (!isCleanable) return beforeStart + afterEnd;

  let bracketOpenIndex = -1;
  let bracketCloseIndex = -1;
  let commaIndex = -1;

  let i = 0;
  while (i <= afterEnd.length) {
    const char = afterEnd[i];
    if (char === ',') {
      commaIndex = i;
    } else if (char === '}') {
      bracketCloseIndex = i;
      break;
    } else if (!/\s/.test(char)) break;
    i++;
  }

  if (bracketCloseIndex === -1) {
    let x = 0;
    let j = beforeStart.length - 1;
    while (j >= 0) {
      const char = beforeStart[j];
      if (!/\s/.test(char)) {
        if (beforeStart.substring(j - 3, j + 1) === 'type') {
          x = 5;
        }
        break;
      }
      j--;
    }

    return (
      beforeStart.substring(0, beforeStart.length - x) +
      (commaIndex === -1 ? afterEnd : afterEnd.substring(commaIndex + 1))
    );
  }

  let j = beforeStart.length - 1;
  while (j >= 0) {
    const char = beforeStart[j];
    if (char === '{') {
      bracketOpenIndex = j;
      break;
    }
    if (!/\s/.test(char)) {
      if (beforeStart.substring(j - 3, j + 1) === 'type') {
        j = j - 4;
        continue;
      }
      break;
    }
    j--;
  }

  if (bracketCloseIndex !== -1 && bracketOpenIndex !== -1) {
    const toBracket = beforeStart.substring(0, bracketOpenIndex).trim();
    const exportLength = toBracket.endsWith('export') ? 6 : toBracket.endsWith('export type') ? 12 : 0;
    if (exportLength) {
      const fromBracket = afterEnd.substring(bracketCloseIndex + 1).trim();
      if (fromBracket.startsWith('from')) {
        const quoteMatch = afterEnd.match(/['"].*?['"]/);
        if (quoteMatch?.index) {
          const fromSpecifierLength = quoteMatch.index + quoteMatch[0].length;
          return toBracket.substring(0, toBracket.length - exportLength) + afterEnd.substring(fromSpecifierLength);
        }
      }

      return toBracket.substring(0, toBracket.length - exportLength) + afterEnd.substring(bracketCloseIndex + 1);
    }
  }

  {
    let x = 0;
    let j = beforeStart.length - 1;
    while (j >= 0) {
      const char = beforeStart[j];
      if (!/\s/.test(char)) {
        if (beforeStart.substring(j - 3, j + 1) === 'type') {
          x = 5;
        }
        break;
      }
      j--;
    }

    return (
      beforeStart.substring(0, beforeStart.length - x) +
      (commaIndex === -1 ? afterEnd : afterEnd.substring(commaIndex + 1))
    );
  }
};
