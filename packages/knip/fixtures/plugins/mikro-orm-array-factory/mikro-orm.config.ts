export default [
  async (contextName: string) => ({
    entities: [`./src/${contextName}`],
  }),
];
