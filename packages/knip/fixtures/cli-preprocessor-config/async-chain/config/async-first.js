export default async function (options) {
  await Promise.resolve();
  options.preprocessorOptions += 'async';
  return options;
}
