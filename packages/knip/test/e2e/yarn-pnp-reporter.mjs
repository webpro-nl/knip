export default ({ issues, counters }) => {
  const result = {
    issues: {
      dependencies: issues.dependencies,
    },
    counters: {
      dependencies: counters.dependencies,
      processed: counters.processed,
      total: counters.total,
    },
  };
  process.stdout.write(`${JSON.stringify(result)}\n`);
};
