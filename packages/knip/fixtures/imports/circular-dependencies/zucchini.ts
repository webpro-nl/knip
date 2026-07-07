export const loadZoodle = async () => {
  const { zoodle } = await import('./zoodle');
  return zoodle();
};
