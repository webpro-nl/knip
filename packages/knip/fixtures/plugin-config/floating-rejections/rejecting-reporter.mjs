export default () => {
  setTimeout(() => Promise.reject(new Error('reporter boom')), 10);
};
