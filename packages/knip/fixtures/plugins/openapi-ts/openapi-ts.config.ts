export default {
  input: 'https://api.example.com/openapi.json',
  output: 'src/client',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/client-fetch',
    {
      name: '@hey-api/sdk',
    },
  ],
};
