export default function (options) {
  return { ...options, issues: { ...options.issues, files: {} } };
}
