export default async function (options) {
  await Promise.resolve();
  options.preprocessorOptions = `${JSON.parse(options.preprocessorOptions).trace}-async`;
  return options;
}
