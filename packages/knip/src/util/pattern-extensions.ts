const TRAILING_BRACE_RE = /\.\{([^{}]+)\}$/;
const TRAILING_PAREN_RE = /\.[@+*?]?\(([^()]+)\)$/;
const TRAILING_LITERAL_RE = /\.([a-zA-Z0-9]+)$/;
const SIMPLE_EXT_RE = /^[a-zA-Z0-9]+$/;

const collectExtensions = (inner: string, delim: string): string[] => {
  const parts = inner.split(delim);
  const exts: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i].trim();
    if (SIMPLE_EXT_RE.test(t)) exts.push(`.${t}`);
  }
  return exts;
};

export const extractPatternExtensions = (pattern: string): string[] => {
  const end = pattern.endsWith('!') ? pattern.length - 1 : pattern.length;
  const slashIdx = pattern.lastIndexOf('/', end - 1);
  const segment = pattern.slice(slashIdx + 1, end);
  if (segment.length === 0) return [];

  const last = segment[segment.length - 1];
  if (last === '}') {
    const m = TRAILING_BRACE_RE.exec(segment);
    return m ? collectExtensions(m[1], ',') : [];
  }
  if (last === ')') {
    const m = TRAILING_PAREN_RE.exec(segment);
    return m ? collectExtensions(m[1], '|') : [];
  }
  const m = TRAILING_LITERAL_RE.exec(segment);
  return m ? [`.${m[1]}`] : [];
};
