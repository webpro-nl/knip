let runs = 0;

export default function (options) {
  runs += 1;
  if (runs === 1) for (const filePath of Object.keys(options.issues.files)) delete options.issues.files[filePath];
  return options;
}
