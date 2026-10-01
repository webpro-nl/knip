export default function (options) {
  console.log(`hi from config preprocessor, you gave me: ${JSON.parse(options.preprocessorOptions).food}`);
  return options;
}
