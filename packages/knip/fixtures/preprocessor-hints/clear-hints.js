export default function (options) {
  options.tagHints.clear();
  return { ...options, configurationHints: [] };
}
