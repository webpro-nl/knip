/** @type {import('@hey-api/openapi-ts').UserConfig} */
export default {
  input: "https://get.heyapi.dev/hey-api/backend",
  output: "src/client",
  plugins: ["@hey-api/client-fetch"],
};
