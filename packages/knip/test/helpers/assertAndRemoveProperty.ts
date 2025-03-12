function assertAndRemoveProperty<TIn extends object, TProp extends keyof TIn>(
  obj: TIn,
  propName: TProp,
  assertProperty: (value: TIn[TProp]) => void
): Omit<TIn, TProp> {
  const { [propName]: value, ...rest } = obj;
  assertProperty(value);

  return rest;
}

export { assertAndRemoveProperty };
