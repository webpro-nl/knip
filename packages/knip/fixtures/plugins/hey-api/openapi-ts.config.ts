import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "https://get.heyapi.dev/hey-api/backend",
  output: "src/client",
  plugins: ["@hey-api/client-fetch"],
});
