let runs = 0;

export default function (options) {
  if (JSON.parse(options.preprocessorOptions).source !== 'session') throw new Error('Missing preprocessor options');
  runs += 1;
  return {
    ...options,
    issues: { ...options.issues, files: {} },
    counters: { ...options.counters, total: runs },
  };
}
