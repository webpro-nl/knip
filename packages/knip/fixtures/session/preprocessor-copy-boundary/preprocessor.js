export default function (options) {
  const isCorrupted = [...options.tagHints].some(hint => hint.tagName === 'mutated');
  options.configurationHints.push({
    type: 'ignore',
    identifier: isCorrupted ? 'collector-corrupted' : 'collector-clean',
  });
  options.tagHints.add({ type: 'tag', filePath: options.cwd, identifier: 'mutated', tagName: 'mutated' });
  for (const records of Object.values(options.issues.files)) {
    for (const issue of Object.values(records)) issue.symbol = `mutated:${issue.symbol}`;
  }
  return options;
}
