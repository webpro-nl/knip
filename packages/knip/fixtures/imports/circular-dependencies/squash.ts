export const loadNoodle = async () => {
  const [{ noodle }] = await Promise.all([import('./noodle')]);
  return noodle();
};
