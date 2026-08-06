export default function (options) {
  const food = options.preprocessorOptions?.food;
  console.log(`hi from config preprocessor with options: ${food}`);
  return options;
}
