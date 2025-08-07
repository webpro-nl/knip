export default [
  { file: 'routes/home.tsx', index: true },
  {
    file: 'routes/layout.tsx',
    children: [{ file: './routes/another-route.tsx' }],
  },
  {
    file: 'routes/route.(with).$special[.chars].tsx',
  },
  {
    file: 'routes/$/route.tsx',
  },
  {
    file: 'routes/$.tsx',
  },
];
