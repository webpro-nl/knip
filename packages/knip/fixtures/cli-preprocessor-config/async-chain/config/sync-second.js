export default function (options) {
  options.preprocessorOptions += '-sync';
  console.log(options.preprocessorOptions);
  return options;
}
