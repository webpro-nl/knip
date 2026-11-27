export default ({ command }: { env: string; command: string; envMode: string }) => ({
  root: command === 'build' ? 'pages' : 'dev-pages',
  globalUIComponents: command === 'build' ? ['./src/ProdWidget.tsx'] : ['./src/DevWidget.tsx'],
});
