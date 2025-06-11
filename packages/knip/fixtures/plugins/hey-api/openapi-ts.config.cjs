/** @type {import('@hey-api/openapi-ts').UserConfig} */
module.exports = {
  input: "https://get.heyapi.dev/hey-api/backend",
  output: {
    path: "src/client2",
  },
  plugins: ["@hey-api/client-fetch"],
};
