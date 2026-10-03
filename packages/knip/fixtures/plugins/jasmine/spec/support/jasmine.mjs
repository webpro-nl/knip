export default {
  spec_dir: "tests",
  spec_files: ["unit/**/*.suite.js", "!unit/**/legacy.suite.js"],
  helpers: ["setup/**/*.js"],
  requires: ["source-map-support/register"],
};
