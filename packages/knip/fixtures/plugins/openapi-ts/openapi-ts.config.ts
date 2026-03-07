export default {
  input: 'https://api.example.com/openapi.json',
  output: 'src/client',
  plugins: [
    '@tanstack/react-query',
    {
      name: 'zod',
    },
  ],
};
