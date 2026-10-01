const getValues = () => {
  throw new Error("This plugin should've been ignored");
};

export default {
  someValue: getValues(),
};
