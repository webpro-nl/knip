export default function (options) {
  console.log(`config preprocessor food: ${JSON.parse(options.preprocessorOptions).food}`);
  return options;
}
