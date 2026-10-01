export default function (options) {
  console.log(`hi from ${options.chain} then second preprocessor`);
  return options;
}
