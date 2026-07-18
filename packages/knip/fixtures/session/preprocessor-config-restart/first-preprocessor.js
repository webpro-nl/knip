export default function (options) {
  for (const records of Object.values(options.issues.files)) {
    for (const issue of Object.values(records)) issue.symbol = `first:${issue.symbol}`;
  }
  return options;
}
