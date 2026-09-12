const urlSchemeMatcher = /^[a-z][a-z\d+.-]*:/i;

export const hasUrlScheme = (value: string) => urlSchemeMatcher.test(value);
