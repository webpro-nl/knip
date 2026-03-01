export default {
  input: 'https://api.example.com/openapi.json',
  output: 'src/client',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    {
      name: '@hey-api/client-fetch',
    },
    '@tanstack/react-query',
  ],
};
